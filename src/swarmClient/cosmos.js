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

const app_endpoint = "http://localhost:1317";
const app_service = "/crud";
//app_endpoint = "http://localhost:6537";
const tx_command = "txs";

const secp256k1 = new ec('secp256k1');

const prefix = 'cosmos';
const chainId = 'namechain';
const path = "m/44'/118'/0'/0/0";

var private_key;
var outstanding_tx = new Map;
var account_info;
var tx_queue = [];

const getECPairPriv = async function(mnemonic) {
    if (typeof mnemonic !== "string") {
        throw new Error("mnemonic expects a string")
    }
    const seed = await bip39.mnemonicToSeed(mnemonic);
    const node = await bip32.fromSeed(seed);
    const child = node.derivePath(path);
    const ecpair = bitcoinjs.ECPair.fromPrivateKey(child.privateKey, {compressed : false})
    return ecpair.privateKey.toString('hex');
};

const getAddress = pubkey => {
    let bytes = hash('ripemd160', hash('sha256', Buffer.from(pubkey, 'hex')))

    return bech32.encode(prefix, bech32.toWords(bytes))
};


const sign_tx = async (rest, privateKey, tx, chain_id) => {
    // Fetch the current state of the account that's signing the transaction
    // We will need its account number and current sequence.

    let url = `${rest}/auth/accounts/${getAddress(secp256k1.keyFromPrivate(privateKey, 'hex').getPublic(true, 'hex'))}`;
    let state = (await axios.get(url)).data;
    console.log("*** state:");
    console.log(state);

    // If the account doesn't exist yet, just stub its data
    if (state) {
        state = state.result;
        // state = JSON.parse(state)
    } else {
        state = {
            value: {},
        }
    }

    let payload = {
        account_number: state.value.account_number || '0',
        chain_id: chain_id,
        fee: sortJson(tx.value.fee),
        memo: tx.value.memo,
        msgs: sortJson(tx.value.msg),
        sequence: state.value.sequence || '0',
    };

    //console.log(payload);

    // Calculate the SHA256 of the payload object
    let jsonHash = hash(
        'sha256',
        Buffer.from(
            JSON.stringify(payload),
            'utf8'
        )
    )

    return {
        pub_key: {
            type: 'tendermint/PubKeySecp256k1',
            value: Buffer.from(
                secp256k1
                    .keyFromPrivate(privateKey, 'hex')
                    .getPublic(true, 'hex'),
                'hex'
            ).toString('base64'),
        },

        // We have to convert the signature to the format that Tendermint uses
        signature: convertSignature(
            secp256k1.sign(jsonHash, privateKey, 'hex', {
                canonical: true,
            }),
        ).toString('base64'),
    }
}

const broadcast_tx = async (rest, privateKey, tx, chain_id) => {
    if (!privateKey || typeof privateKey !== 'string') {
        throw Error('Invalid private key.')
    }

    if (!tx) {
        throw Error('Invalid transaction.')
    }

    tx.value.signatures = tx.value.signatures || [];

    const sig = await sign_tx(rest, privateKey, tx, chain_id);
    tx.value.signatures.push(sig);
//    console.log("*** broadcasting tx..." + JSON.stringify(tx.value, null, 4));
    console.log("*** broadcasting tx...");

    // Post the transaction
    let res = await axios.post(`${rest}/txs`, {
        headers: {'Content-type': 'application/x-www-form-urlencoded'},
        tx: tx.value,
        mode: 'block' // this can also be sync or async, but block ensures that the transactions is commited
    }).catch(function(err){
        console.log("error caught");
        return;
    });

    console.log("returning from broadcast_tx");
    return res.data
}

// export async function call_endpoint(req_type, ep_name, data, mnemonic, callback)
// {
//     const url = app_endpoint + app_service + '/' + ep_name;
//     let cb = callback;
//     let cid = data.BaseReq.chain_id;
//     console.log("Sending request: ");
//     console.log(JSON.stringify(data, null, 4));
//     const tx = axios({
//         method: req_type,
//         url: url,
//         data: data,
//         headers: {'Content-type': 'application/x-www-form-urlencoded'}
//     })
//         .then (await async function(response) {
//             console.log("*** raw transaction:" + JSON.stringify(response.data, null, 4));
//             const pkey = await getECPairPriv(mnemonic);
//             const res = await broadcast_tx(app_endpoint, pkey, response.data, cid);
//             cb && cb(res);
//         })
//         .catch(function(err) {
//             console.log("*** error response:")
//             console.log(err.response.data);
//             cb && cb(err.response.data);
//             return;
//         });
// }

export async function call_endpoint(req_type, ep_name, data, mnemonic, callback)
{
    const url = app_endpoint + app_service + '/' + ep_name;
    let cb = callback;
    let cid = data.BaseReq.chain_id;
    console.log("Sending request: ");
//    console.log(JSON.stringify(data, null, 4));
    const request = {
        method: req_type,
        url: url,
        data: data,
        headers: {'Content-type': 'application/x-www-form-urlencoded'}
    };

    console.log("1");
    const response = await axios(request);
    console.log("2");

    //console.log(response);


//    console.log("*** raw transaction:" + JSON.stringify(response.data, null, 4));
    const pkey = await getECPairPriv(mnemonic);
    console.log("3");
    const res = await broadcast_tx(app_endpoint, pkey, response.data, cid);
    console.log("done broadcast_tx");
    cb && cb(res);


        // .catch(function(err) {
        //     console.log("*** error response:")
        //     console.log(err.response.data);
        //     cb && cb(err.response.data);
        //     return;
        // });

    console.log("returning from call_endpoint");
}



export async function query(uuid, key, callback)
{
    const url = app_endpoint + app_service + '/read/' + uuid + '/' + key;
    let cb = callback;

    const res = axios({
        method: 'get',
        url: url,
    })
    .then(async function(response) {
        console.log("*** raw response:" + JSON.stringify(response.data, null, 4));
        cb && cb(response.data);
    })
        .catch(function(err){
            console.log("*** error response:")
        console.log(err.response.data);
        cb && cb(err.response.data);
        return;
    });
}

// transaction object
//   url
//   hash
//   seq?
//   promise

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

function sign_transaction(key, data, chain_id)
{
    let payload = {
        account_number: account_info.value.account_number || '0',
        chain_id: chain_id,
        fee: sortJson(data.value.fee),
        memo: data.value.memo,
        msgs: sortJson(data.value.msg),
        sequence: account_info.value.sequence || '0',
    };

    // Calculate the SHA256 of the payload object
    let jsonHash = hash('sha256', Buffer.from(JSON.stringify(payload),'utf8'));

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

    data.value.signatures = data.value.signatures || [];
    const sig = sign_transaction(private_key, data, chain_id);
    data.value.signatures.push(sig);

    // Post the transaction
    let res = await axios.post(`${url}/txs`, {
        headers: {'Content-type': 'application/x-www-form-urlencoded'},
        tx: data.value,
        mode: 'async'
    })
    .catch(function(err)
    {
        console.log("error caught");
        return;
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

    // get tx skeleton
    const response = await axios(request);

    // broadcast the tx
    // TODO: handle errors here
    const res = await send_tx(app_endpoint, response.data, chain_id);
    if (res.txhash)
    {
        // start polling for result
        poll_tx(tx, res.txhash, 0);
    }
}

function poll_tx(tx, hash, timeout)
{
//    outstanding_tx.set(hash, tx);
    setTimeout(async function()
    {
        // query the tx status
        query_tx(hash).then(function(res)
        {
            if (res.data.logs[0].success)
            {
                tx.deferred.resolve(res.data);
            }
            else
            {
                tx.deferred.reject(res.data.logs[0].log);
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

        // let res = await query_tx(hash);
        // if (res.data.logs[0].success)
        // {
        //     tx.deferred.resolve(result);
        // }
        // else
        // {
        //     // if result is not ready
        //     poll_tx(tx, hash);
        //
        //     // else if result is error
        //
        //         // if result is sequence bad
        //
        //         // else reject
        // }
    }, timeout);
}

async function query_tx(hash)
{
    let res = await axios.get(`${app_endpoint}/txs/${hash}`);
    return res;

    // const res = axios({
    //     method: 'get',
    //     url: url,
    // })
    //     .then(async function(response) {
    //         console.log("*** raw response:" + JSON.stringify(response.data, null, 4));
    //         cb && cb(response.data);
    //     })
    //     .catch(function(err){
    //         console.log("*** error response:")
    //         console.log(err.response.data);
    //         cb && cb(err.response.data);
    //         return;
    //     });
}

async function send_account_query()
{
    // Fetch the current state of the account that's signing the transaction
    // We will need its account number and current sequence.

    let url = `${app_endpoint}/auth/accounts/${getAddress(secp256k1.keyFromPrivate(private_key, 'hex').getPublic(true, 'hex'))}`;
    let response = await axios.get(url);
    handle_account_response(response);
}

function handle_account_response(response)
{
    let state = response.data;
    console.log("*** state:");
    console.log(state);

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

async function handle_tx_response()
{

}

async function handle_poll_timer()
{

}

async function handle_query_response()
{

}

async function next_tx()
{
    await begin_tx(tx_queue[0]);
}


////////////////////////////////////////////////////////

export async function init(mnemonic)
{
    private_key = await getECPairPriv(mnemonic);
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

