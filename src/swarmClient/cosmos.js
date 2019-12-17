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

//const private_key = "gvD7MJB1mR5gXV8T5kwIEve4mnT4BScZ5HkrBFI485+U+XrwIlxOTgQCKpxkA4wK" +
    "bf8v5yWq8Nq5oDfUZ8yk9PnmO96bfKqy1WMIE+M=" +
    "=IRuC";

const private_key = "xprv9s21ZrQH143K4DWF9YbcFAPnYPckMyZWQH418YTdC76W8pGRFVxQtidqwmJfCwW2of2KYN4xVvykwvNa7W76b8TkG9bbPkWZoxfEb7NgKYx";
const mnemonic = "silver sustain impose zero appear unaware desert index broom blur very category broken field mind arm increase custom despair blame secret term upgrade there";

// function rest_type(req_type)
// {
//     switch (req_type)
//     {
//         case "GET":
//             return 'get';
//         case "PUT":
//             return 'put';
//         case "POST":
//             return 'post';
//         case "DELETE":
//             return 'delete';
//     }
//
// //    throw
// }

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


const sign_tx = async (privateKey, tx) => {
    // Fetch the current state of the account that's signing the transaction
    // We will need its account number and current sequence.

    let pubkey = secp256k1.keyFromPrivate(privateKey, 'hex').getPublic(true, 'hex');
    let addr = getAddress(pubkey);
    let url = `${app_endpoint}/auth/accounts/${addr}`;
    let state = (await axios.get(url)).data

    // If the account doesn't exist yet, just stub its data
    if (state) {
//        state = JSON.parse(state)
        state = state.result;
    } else {
        state = {
            value: {},
        }
    }

    // Calculate the SHA256 of the payload object
    let jsonHash = hash(
        'sha256',
        Buffer.from(
            JSON.stringify({
                account_number: state.value.account_number || '0', // We can use 0 if we don't have the data
                chain_id: chainId,
                fee: sortJson(tx.value.fee),
                memo: tx.value.memo,
                msgs: sortJson(tx.value.msg[0].value), // JSON always has to be sorted according to object keys
                sequence: state.value.sequence || '0',
            }),
            'utf8'
        )
    )

    let sig =  secp256k1.sign(jsonHash, privateKey, 'hex', {
        canonical: true
    });

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
        signature: convertSignature(sig).toString('base64'),
    }
}
// function sign_tx(tx)
// {
//
// }

async function broadcast_tx(tx, sig)
{
    tx.signatures = [];
//    tx.signatures.push(sig);
    let data = {
        tx: {
            type: "cosmos-sdk/StdTx",
            value: {
                ...tx,
                return: 'block' // this can also be sync or async, but block ensures that the transactions is commited
            }
        },
    };
    data.tx.value.signatures.push(sig);
    console.log("*** data:");
    console.log(data);
    let strdata = JSON.stringify(data);
    console.log("*** strdata:");
    console.log(strdata);
    let res = await axios.post(`${app_endpoint}/txs`, strdata);
    return res.data;
}


const signTx = async (rest, privateKey, tx) => {
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
        account_number: state.value.account_number || '0', // We can use 0 if we don't have the data
        chain_id: chainId,
        fee: sortJson(tx.value.fee),
        memo: tx.value.memo,
//        msgs: sortJson(tx.value.msg[0].value), // JSON always has to be sorted according to object keys
        msgs: sortJson(tx.value.msg), // JSON always has to be sorted according to object keys
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
        //
        // account_number: state.value.account_number || '0',
        //
        // sequence: state.value.sequence || '0'
    }
}

const broadcastTransaction = async (rest, privateKey, tx) => {
    if (!privateKey || typeof privateKey !== 'string') {
        throw Error('Invalid private key.')
    }

    if (!tx) {
        throw Error('Invalid transaction.')
    }

    tx.value.signatures = tx.value.signatures || [];
    //
    // // Add the signature to the transaction object, using the method described above
    // tx.value.signatures.push(await signTx(rest, privateKey, tx));
    // tx.value.signatures.account_number = tx.value.signatures[0].account_number;
    // tx.value.signatures.sequence = tx.value.signatures[0].sequence;

    const sig = await signTx(rest, privateKey, tx);
    // tx.value.signature = {
    //     ...sig
    // };

    tx.value.signatures.push(sig);
    console.log(JSON.stringify(tx.value));

    // Post the transaction
    let res = await axios.post(`${rest}/txs`, {
        headers: {'Content-type': 'application/x-www-form-urlencoded'},
        tx: tx.value,
//        return: 'block' // this can also be sync or async, but block ensures that the transactions is commited
        mode: 'block' // this can also be sync or async, but block ensures that the transactions is commited
    }).catch(function (res){
        console.log("error caught");
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
            const pkey = await getECPairPriv(mnemonic);
            const res = await broadcastTransaction(app_endpoint, pkey, response.data);
            cb && cb(res);
        });
}

// const trx =
//     {
//         "tx": {
//             "type":"cosmos-sdk/StdTx",
//             "value": {
//                 "msg":[
//                     {
//                         "type":"nameservice/BuyName",
//                         "value": {
//                             "name":"paul.id",
//                             "bid": [
//                                 {
//                                     "denom":"nametoken",
//                                     "amount":"5"
//                                 }
//                             ],
//                             "buyer": "cosmos1xnpwc2lxetddhr7wguq72rtjr5gsqxl33ddv3c"
//                         }
//                     }
//                 ],
//                 "fee": {
//                     "amount":[],
//                     "gas":"200000"
//                 },
//                 "signatures":[
//                     {
//                         "pub_key":{
//                             "type":"tendermint/PubKeySecp256k1",
//                             "value":"A74LoEjNRBTnoa/KxMzwC7cfetW+S+hom98/3mh2Gb/d"
//                         },
//                         "signature":"IdVkPtYf5KcDyOF7OEb84Dk8LGAyZspgYmJpgKpmWbIMiPOynFM0WO0VCurLv2QCaBkIzBXBlGLCIXA2qUxNag=="
//                     }
//                 ],
//                 "memo":"",
//                 "return":"block"
//             }
//         }
//     }


const trans =
{
    "tx":{
        "msg":[
            {
                "type":"nameservice/BuyName",
                "value":{
                    "name":"paul.id","bid":[
                        {
                            "denom":"nametoken",
                            "amount":"5"
                        }
                        ],
                    "buyer":"cosmos1kuhpeq7enqq36zzlwewpangf9uxkgpktxr463r"
                }
            }
            ],
        "fee":{
            "amount":[],
            "gas":"200000"
        },
        "signatures":[
            {
                "pub_key":{
                    "type":"tendermint/PubKeySecp256k1",
                    "value":"A74LoEjNRBTnoa/KxMzwC7cfetW+S+hom98/3mh2Gb/d"
                },
                "signature":"bzhIELnkbEyOhX3vLZMlclKxdm8XkY06cxSt6N7LCeA/OKVKaDTN9dLI+FYZ6fzgHcyKwYoor+ve/RrrBiIuIA=="
            }
            ],
        "memo":""
    },
    "return":"block"
}


const xxx =
{
    "msg":[
        {
            "type":"nameservice/BuyName",
            "value":{
                "name":"paul.id",
                "bid":[
                    {
                        "denom":"nametoken",
                        "amount":"5"
                    }
                    ],
                "buyer":"cosmos1kuhpeq7enqq36zzlwewpangf9uxkgpktxr463r"
            }
        }
        ],
    "fee":{
        "amount":[],
        "gas":"200000"
    },"signatures":[
        {
            "pub_key":{
                "type":"tendermint/PubKeySecp256k1",
                "value":"A74LoEjNRBTnoa/KxMzwC7cfetW+S+hom98/3mh2Gb/d"
            },
            "signature":"bzhIELnkbEyOhX3vLZMlclKxdm8XkY06cxSt6N7LCeA/OKVKaDTN9dLI+FYZ6fzgHcyKwYoor+ve/RrrBiIuIA==",
            "account_number":"0",
            "sequence":"4"
        }
        ],
    "memo":""
};

const rrr =
{
    "msg":[
        {
            "type":"nameservice/BuyName",
            "value":{
                "name":"paul.id",
                "bid":[
                    {
                        "denom":"nametoken","amount":"5"
                    }
                    ],
                "buyer":"cosmos1kuhpeq7enqq36zzlwewpangf9uxkgpktxr463r"
            }
        }
        ],
    "fee":{
        "amount":[],
        "gas":"200000"
    },
    "signatures":[
        {
            "pub_key":{
                "type":"tendermint/PubKeySecp256k1",
                "value":"A74LoEjNRBTnoa/KxMzwC7cfetW+S+hom98/3mh2Gb/d"
            },
            "signature":"bzhIELnkbEyOhX3vLZMlclKxdm8XkY06cxSt6N7LCeA/OKVKaDTN9dLI+FYZ6fzgHcyKwYoor+ve/RrrBiIuIA==",
            "account_number":"0",
            "sequence":"4"
        }
        ],
    "memo":""
}