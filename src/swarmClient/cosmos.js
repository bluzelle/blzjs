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
const app_service = "/nameservice";
//app_endpoint = "http://localhost:6537";
const tx_command = "txs";

const secp256k1 = new ec('secp256k1');

const prefix = 'cosmos';
const chainId = 'namechain';
const path = "m/44'/118'/0'/0/0";

// TODO: allow specification of private key somehow
const mnemonic = "silver sustain impose zero appear unaware desert index broom blur very category broken field mind arm increase custom despair blame secret term upgrade there";

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


const sign_tx = async (rest, privateKey, tx) => {
    // Fetch the current state of the account that's signing the transaction
    // We will need its account number and current sequence.

    let url = `${rest}/auth/accounts/${getAddress(secp256k1.keyFromPrivate(privateKey, 'hex').getPublic(true, 'hex'))}`;
    let state = (await axios.get(url)).data;

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
        chain_id: chainId,
        fee: sortJson(tx.value.fee),
        memo: tx.value.memo,
        msgs: sortJson(tx.value.msg),
        sequence: state.value.sequence || '0',
    };

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

const broadcast_tx = async (rest, privateKey, tx) => {
    if (!privateKey || typeof privateKey !== 'string') {
        throw Error('Invalid private key.')
    }

    if (!tx) {
        throw Error('Invalid transaction.')
    }

    tx.value.signatures = tx.value.signatures || [];

    const sig = await sign_tx(rest, privateKey, tx);
    tx.value.signatures.push(sig);
    console.log("*** broadcasting tx..." + JSON.stringify(tx.value, null, 4));

    // Post the transaction
    let res = await axios.post(`${rest}/txs`, {
        headers: {'Content-type': 'application/x-www-form-urlencoded'},
        tx: tx.value,
        mode: 'block' // this can also be sync or async, but block ensures that the transactions is commited
    }).catch(function(err){
        console.log("error caught");
        return;
    });

    return res.data
}

export async function call_endpoint(req_type, ep_name, data, callback)
{
    const url = app_endpoint + app_service + '/' + ep_name;
    let cb = callback;
    const tx = axios({
        method: req_type,
        url: url,
        data: data,
        headers: {'Content-type': 'application/x-www-form-urlencoded'}
    })
        .then(async function(response) {
            console.log("*** raw transaction:" + JSON.stringify(response.data, null, 4));
            const pkey = await getECPairPriv(mnemonic);
            const res = await broadcast_tx(app_endpoint, pkey, response.data);
            cb && cb(res);
        });
}

export async function query(key, callback)
{
    const url = app_endpoint + app_service + '/' + "key";
    let cb = callback;

    const res = axios({
        method: 'get',
        url: url,
    })
    .then(async function(response) {
        console.log("*** raw response:" + JSON.stringify(response.data, null, 4));
        cb && cb(response.data);
    });
}

