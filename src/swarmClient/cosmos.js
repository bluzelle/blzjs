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
var account_info = { account_number : "", sequence : ""};
var tx_queue = [];

const token_name = 'bnt';
const MAX_RETRIES = 10;
const RETRY_INTERVAL = 1000; // 1 second

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

function make_random_string(length)
{
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ )
    {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
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
        this.retries_left = MAX_RETRIES;
    }
}

function sign_transaction(key, data, chain_id)
{
    let payload = {
        account_number: account_info.account_number || '0',
        chain_id: chain_id,
        fee: util.sortJson(data.value.fee),
        memo: data.value.memo,
        msgs: util.sortJson(data.value.msg),
        sequence: (account_info.sequence || '0')
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

        account_number: account_info.account_number,
        sequence: account_info.sequence

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
    data.value.memo = make_random_string(32);
    const sig = sign_transaction(private_key, data, chain_id);
    data.value.signatures.push(sig);
    data.value.signature = sig;

    // Post the transaction
    let res = await axios.post(`${url}/${tx_command}`, {
        headers: {'Content-type': 'application/x-www-form-urlencoded'},
        tx: data.value,
        mode: 'block' // wait for tx to be committed
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
        if (tx.max_gas && parseInt(response.data.value.fee.gas) > parseInt(tx.max_gas))
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
    }
    catch (err)
    {
        tx.deferred.reject(new Error(err.message));
        advance_queue();
        return;
    }

    try
    {
        // broadcast the tx
        res = await send_tx(app_endpoint, response.data, chain_id);
    }
    catch (err)
    {
        tx.deferred.reject(new Error(err.message));
        advance_queue();
        return;
    }

    // note - as of right now (3/6/20) the responses returned by the Cosmos REST interface now look like this:
    // success case: {"height":"0","txhash":"3F596D7E83D514A103792C930D9B4ED8DCF03B4C8FD93873AB22F0A707D88A9F","raw_log":"[]"}
    // failure case: {"height":"0","txhash":"DEE236DEF1F3D0A92CB7EE8E442D1CE457EE8DB8E665BAC1358E6E107D5316AA","code":4,
    //  "raw_log":"unauthorized: signature verification failed; verify correct account sequence and chain-id"}
    //
    // This is far from ideal, doesn't match their docs, and is probably going to change (again) in the future.
    //

    if (!res.code)
    {
        // bump our sequence number
        account_info.sequence = `${++account_info.sequence}`;

        tx.deferred.resolve(res.data);

        advance_queue();
    }
    else
    {
        if (res.raw_log.search("signature verification failed") !== -1)
        {
            update_account_sequence(tx, MAX_RETRIES);
        }
        else
        {
            tx.deferred.reject(new Error(extract_error_from_message(res.raw_log)));
            advance_queue();
        }
    }
}

function update_account_sequence(tx, retries)
{
    if (retries)
    {
        setTimeout(async function ()
        {
            // signature fail. Either sequence number or chain id is invalid
            const changed = await send_account_query();
            if (changed)
            {
                await begin_tx(tx);
            }
            else
            {
                update_account_sequence(tx, retries - 1);
            }
        }, RETRY_INTERVAL);
    }
    else
    {
        // at this point, assume it's the chain id that is bad
        tx.deferred.reject(new Error("Invalid chain id"));
        advance_queue();
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

function extract_error_from_message(msg)
{
    // this is very fragile and will break if Cosmos changes their error format again
    // currently it looks like "unauthorized: Key already exists: failed to execute message; message index: 0"
    // and we just want the "Key already exists" bit.
    var offset1 = msg.search(": ");
    if (offset1 == -1)
    {
        return msg;
    }

    var offset2 = msg.indexOf(':', offset1 + 1);
    return msg.substring(offset1 + 2, offset2);
}

async function send_account_query()
{
    // Fetch the current state of the account that's signing the transaction
    // We will need its account number and current sequence.

    let url = `${app_endpoint}/auth/accounts/${get_address(secp256k1.keyFromPrivate(private_key, 'hex').getPublic(true, 'hex'))}`;
    let response = await axios.get(url);
    return handle_account_response(response);
}

function handle_account_response(response)
{
    let state = response.data;

    if (state && state.result && state.result.value.account_number && state.result.value.sequence)
    {
        account_info.account_number = `${state.result.value.account_number}`;
        if (account_info.sequence !== `${state.result.value.sequence}`)
        {
            account_info.sequence = `${state.result.value.sequence}`;
            return true;
        }
        return false;
    }

    throw(new Error("Invalid account information"));
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
    try
    {
        await send_account_query();
        return true;
    }
    catch (err)
    {
        return false;
    }
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
                reject(new Error("An error occurred"));
            }
        }
    });
}

module.exports =
{
    init,
    send_transaction,
    query,
    MAX_RETRIES,
    RETRY_INTERVAL
};
