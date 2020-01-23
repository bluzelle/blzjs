//const fetch = require('node-fetch');
//const axios = require('axios').default;
//export const request_type = {GET: 'get', PUT: 'put', POST: 'post', DELETE: 'delete'};
//Object.freeze(request_type);

import { hash, convertSignature, sortJson } from './util'
import axios from 'axios'
import { ec } from 'elliptic'
import bech32 from 'bech32'
const bitcoinjs = require('bitcoinjs-lib');
const bip32 = require('bip32');
const bip39 = require('bip39');

//const app_endpoint = "http://3.15.204.96:1317";
var app_endpoint = "http://localhost:1317";
const app_service = "/crud";
//app_endpoint = "http://localhost:6537";
const tx_command = "txs";

const secp256k1 = new ec('secp256k1');

const prefix = 'cosmos';
const path = "m/44'/118'/0'/0/0";

var private_key;
var account_info;
var tx_queue = [];

async function get_ec_private_key(mnemonic)
{
    const seed = await bip39.mnemonicToSeed(mnemonic);
    const node = await bip32.fromSeed(seed);
    const child = node.derivePath(path);
    const ecpair = bitcoinjs.ECPair.fromPrivateKey(child.privateKey, {compressed : false});
    return ecpair.privateKey.toString('hex');
}

function get_address(pubkey)
{
    let bytes = hash('ripemd160', hash('sha256', Buffer.from(pubkey, 'hex')));
    return bech32.encode(prefix, bech32.toWords(bytes))
}

class deferred {
    constructor() {
        this.promise = new Promise((resolve, reject)=> {
            this.reject = reject
            this.resolve = resolve
        })
    }
}

class transaction {
    constructor(req_type, ep_name, data, def) {
        this.type = req_type;
        this.ep = ep_name;
        this.data = data;
        this.deferred = def;
    }
}

function bin2string(bin)
{
    var str = "";
    for (var i = 0; i < bin.length; i++)
    {
        str += bin[i].toString() + ' ';
    }

    return str;
}

function sign_transaction(key, data, chain_id)
{
    let payload = {
        account_number: account_info.value.account_number || '0',
        chain_id: chain_id,
        fee: sortJson(data.value.fee),
        memo: data.value.memo,
        msgs: sortJson(data.value.msg),
        sequence: (account_info.value.sequence || '0')
    };

    // Calculate the SHA256 of the payload object
    let jsonHash = hash('sha256', Buffer.from(JSON.stringify(payload)));

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
        signature: convertSignature(
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

    //console.log("Sending tx seq " + account_info.value.sequence);

    // set up the signature
    data.value.signatures = [];
    const sig = sign_transaction(private_key, data, chain_id);
    data.value.signatures.push(sig);

    // Post the transaction
    let res = await axios.post(`${url}/${tx_command}`, {
        headers: {'Content-type': 'application/x-www-form-urlencoded'},
        tx: data.value,
        mode: 'sync' // wait for checkTx
    })
    .catch(function(err)
    {
        console.log("error caught");
        console.log(err);
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

        // broadcast the tx
        res = await send_tx(app_endpoint, response.data, chain_id);
    }
    catch(err)
    {
        tx.deferred.reject(err);
        return;
    }

    if (res.logs)
    {
        // bump our sequence number
        account_info.value.sequence = `${++account_info.value.sequence}`;

        // start polling for result
        poll_tx(tx, res.txhash, 0);

        // kick off next tx
        tx_queue.shift();
        if (tx_queue.length)
        {
            setTimeout(function() {
                next_tx();
            });
        }
    }
    else
    {
        let info = JSON.parse(res.raw_log);
        if (info.code == 4)
        {
            // signature fail. Assume sequence number is invalid
            await send_account_query();

            // retry
            setTimeout(function() {
                begin_tx(tx);
            });
        }
    }
}

function poll_tx(tx, hash, timeout)
{
    setTimeout(async function()
    {
        // query the tx status
        query_tx(hash).then(function(res)
        {
            if (res.data.logs[0].success)
            {
                tx.deferred.resolve(res);
            }
            else
            {
                let err = JSON.parse(res.data.logs[0].log);
                tx.deferred.reject({Error: err.message});
            }
        })
        .catch(function(err)
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
    let response = await axios.get(url);
    handle_account_response(response);
}

function handle_account_response(response)
{
    let state = response.data;
    //console.log(state);

    // If the account doesn't exist yet, just stub its data
    if (state)
    {
        account_info = state.result;
    }
    else
    {
        account_info = { value: {} }
    }
}

async function next_tx()
{
    await begin_tx(tx_queue[0]);
}


////////////////////////////////////////////////////////
// exported functions
////////////////////////////////////////////////////////


export async function init(mnemonic, endpoint)
{
    app_endpoint = endpoint ? endpoint : app_endpoint;
    private_key = await get_ec_private_key(mnemonic);
    await send_account_query();
}

export async function send_transaction(req_type, ep_name, data)
{
    let def = new deferred();
    let tx = new transaction(req_type, ep_name, data, def);
    tx_queue.push(tx);
    if (tx_queue.length == 1)
    {
        setTimeout(function() {
            next_tx();
        });
    }

    return def.promise;
}

export async function query(ep)
{
    return new Promise(async (resolve, reject)=>
    {
        try
        {
            let res = await axios.get(`${app_endpoint}${app_service}/${ep}`);
            console.log(res.data);
            resolve(res.data.result);
        }
        catch(error)
        {
            reject(error);
        }
    });
}

