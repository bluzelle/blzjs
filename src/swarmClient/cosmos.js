//
// Copyright (C) 2020 Bluzelle
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

const util = require('./util');
const axios = require ('axios');
const ec = require ('elliptic').ec;
const bech32 = require ('bech32');

const bitcoinjs = require('bitcoinjs-lib');
const bip32 = require('bip32');
const bip39 = require('bip39');

var app_endpoint = "http://localhost:1317";
const app_service = "/crud";
const tx_command = "txs";

const secp256k1 = new ec('secp256k1');

const prefix = 'bluzelle';
const path = "m/44'/118'/0'/0/0";

var private_key;
var account_info = {};
var tx_queue = [];

const token_name = 'bnt';

async function get_ec_private_key(mnemonic)
{
    const seed = await bip39.mnemonicToSeed(mnemonic);
    const node = await bip32.fromSeed(seed);
    const child = node.derivePath(path);
    const ecpair = bitcoinjs.ECPair.fromPrivateKey(child.privateKey, {compressed: false});
    return ecpair.privateKey.toString('hex');
}

function get_address(pubkey)
{
    let bytes = util.hash('ripemd160', util.hash('sha256', Buffer.from(pubkey, 'hex')));
    return bech32.encode(prefix, bech32.toWords(bytes))
}

class deferred
{
    constructor()
    {
        this.promise = new Promise((resolve, reject) =>
        {
            this.reject = reject
            this.resolve = resolve
        })
    }
}

class transaction
{
    constructor(req_type, ep_name, data, def)
    {
        this.type = req_type;
        this.ep = ep_name;
        this.data = data;
        this.deferred = def;
        this.gas_price = 0;
        this.max_gas = 0;
        this.max_fee = 0;
    }
}

function sign_transaction(key, data, chain_id)
{
    let payload = {
        account_number: account_info.value.account_number || '0',
        chain_id: chain_id,
        fee: util.sortJson(data.value.fee),
        memo: data.value.memo,
        msgs: util.sortJson(data.value.msg),
        sequence: (account_info.value.sequence || '0')
    };

    // Calculate the SHA256 of the payload object
    let jsonHash = util.hash('sha256', Buffer.from(JSON.stringify(payload)));

    return {
        pub_key: {
            type: 'tendermint/PubKeySecp256k1',
            value: Buffer.from(
                secp256k1
                    .keyFromPrivate(key, 'hex')
                    .getPublic(true, 'hex'),
                'hex'
            ).toString('base64'),
        },

        // We have to convert the signature to the format that Tendermint uses
        signature: util.convertSignature(
            secp256k1.sign(jsonHash, key, 'hex', {
                canonical: true,
            }),
        ).toString('base64'),
    }
}


async function send_tx(url, data, chain_id)
{
    if (!data)
    {
        throw Error('Invalid transaction.');
    }

    // set up the signature
    data.value.signatures = [];
    const sig = sign_transaction(private_key, data, chain_id);
    data.value.signatures.push(sig);

    // Post the transaction
    let res = await axios.post(`${url}/${tx_command}`, {
        headers: {'Content-type': 'application/x-www-form-urlencoded'},
        tx: data.value,
        mode: 'sync' // wait for checkTx
    });

    return res.data
}

async function begin_tx(tx)
{
    const url = app_endpoint + app_service + '/' + tx.ep;
    let chain_id = tx.data.BaseReq.chain_id;

    const request = {
        method: tx.type,
        url: url,
        data: tx.data,
        headers: {'Content-type': 'application/x-www-form-urlencoded'}
    };

    var response;
    var res;
    try
    {
        // get tx skeleton
        response = await axios(request);

        // set the gas info
        if (tx.max_gas && parseInt(response.data.value.fee.gas > tx.max_gas))
        {
            response.data.value.fee.gas = `${tx.max_gas}`;
        }

        if (tx.max_fee)
        {
            response.data.value.fee.amount = [{'denom': `${token_name}`, 'amount': `${tx.max_fee}`}];
        }
        else if (tx.gas_price)
        {
            response.data.value.fee.amount = [{
                'denom': `${token_name}`,
                'amount': `${response.data.value.fee.gas * tx.gas_price}`
            }];
        }

        // broadcast the tx
        res = await send_tx(app_endpoint, response.data, chain_id);
    }
    catch (err)
    {
        tx.deferred.reject(err.message);
        advance_queue();
        return;
    }

    if (res.logs)
    {
        // bump our sequence number
        account_info.value.sequence = `${++account_info.value.sequence}`;

        // start polling for result
        poll_tx(tx, res.txhash, 0);

        advance_queue();
    }
    else
    {
        let info = JSON.parse(res.raw_log);
        if (info.code == 4)
        {
            // signature fail. Assume sequence number is invalid
            await send_account_query();

            // retry
            setTimeout(function ()
            {
                begin_tx(tx);
            });
        }
        else
        {
            tx.deferred.reject(res.raw_log);
            advance_queue();
        }
    }
}

function advance_queue()
{
    tx_queue.shift();
    if (tx_queue.length)
    {
        setTimeout(function ()
        {
            next_tx();
        });
    }
}

function poll_tx(tx, hash, timeout)
{
    setTimeout(async function ()
    {
        // query the tx status
        query_tx(hash).then(function (res)
        {
            if (res.data.logs)
            {
                if (res.data.logs[0].success)
                {
                    tx.deferred.resolve(res);
                }
                else
                {
                    let err = JSON.parse(res.data.logs[0].log);
                    tx.deferred.reject(new Error(err.message));
                }
            }
            else
            {
                try
                {
                    const err = JSON.parse(res.data.raw_log);
                    tx.deferred.reject(new Error(err.message));
                }
                catch (err)
                {
                    tx.deferred.reject(new Error(res.data.raw_log));
                }
            }
        })
            .catch(function (err)
            {
                if (err.response.status == 404)
                {
                    // tx not committed yet, retry
                    poll_tx(tx, hash, 1000);
                }
                else
                {
                    tx.deferred.reject(err.message);
                }
            });
    }, timeout);
}

async function query_tx(hash)
{
    let res = await axios.get(`${app_endpoint}/${tx_command}/${hash}`);
    return res;
}

async function send_account_query()
{
    // Fetch the current state of the account that's signing the transaction
    // We will need its account number and current sequence.

    let url = `${app_endpoint}/auth/accounts/${get_address(secp256k1.keyFromPrivate(private_key, 'hex').getPublic(true, 'hex'))}`;
    try
    {
        let response = await axios.get(url);
        return handle_account_response(response);
    }
    catch(err)
    {
        return false;
    }
}

function handle_account_response(response)
{
    let state = response.data;

    if (state && state.result && state.result.value.account_number && state.result.value.sequence)
    {
        account_info = state.result;
        return true;
    }

    return false;
}

async function next_tx()
{
    await begin_tx(tx_queue[0]);
}


////////////////////////////////////////////////////////
// exported functions
////////////////////////////////////////////////////////

async function init(mnemonic, endpoint)
{
    app_endpoint = endpoint ? endpoint : app_endpoint;
    private_key = await get_ec_private_key(mnemonic);
    return await send_account_query();
}

async function send_transaction(req_type, ep_name, data, gas_info)
{
    let def = new deferred();
    let tx = new transaction(req_type, ep_name, data, def);
    if (gas_info)
    {
        if (gas_info.max_gas)
        {
            tx.max_gas = gas_info.max_gas;
        }
        if (gas_info.max_fee)
        {
            tx.max_fee = gas_info.max_fee;
        }
        if (gas_info.gas_price)
        {
            tx.gas_price = gas_info.gas_price;
        }
    }

    tx_queue.push(tx);
    if (tx_queue.length == 1)
    {
        setTimeout(function ()
        {
            next_tx();
        });
    }

    return def.promise;
}

async function query(ep)
{
    return new Promise(async (resolve, reject) =>
    {
        try
        {
            let res = await axios.get(`${app_endpoint}${app_service}/${ep}`);
            resolve(res.data.result);
        }
        catch (error)
        {
//            reject(error);
            if (typeof error.response.data === 'string')
            {
                reject(new Error(error.response.data));
            }
            else if (typeof error.response.data.error === 'string')
            {
                try
                {
                    var err = JSON.parse(error.response.data.error);
                    reject(new Error(err.message));
                }
                catch (e)
                {
                    reject(new Error(error.response.data.error));
                }
            }
            else
            {
                reject("An error occurred");
            }
        }
    });
}

module.exports =
{
    init,
    send_transaction,
    query
};