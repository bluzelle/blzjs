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
import assert from 'assert'
import {Transaction} from "./Transaction";
import {Deferred} from "./Deferred";
import {range, random, extend, isNumber} from 'lodash';
import {ClientErrors} from "./ClientErrors";
import {BIP32Interface} from "bip32";
import {ECPairInterface} from "bitcoinjs-lib";
import {GasInfo} from "../GasInfo";

const util = require('./util');
const axios = require('axios');
const ec = require('elliptic').ec;
const bech32 = require('bech32');

const bitcoinjs = require('bitcoinjs-lib');
const bip32 = require('bip32');
const bip39 = require('bip39');

let app_endpoint: string;
let private_key: string;
const account_info: { account_number: string, sequence: number } = {account_number: "", sequence: 0};
const tx_queue: any[] = [];

const TX_COMMAND = "txs";

const secp256k1 = new ec('secp256k1');

const BECH32_PREFIX: string = 'bluzelle';


const TOKEN_NAME = 'ubnt';

export const MAX_RETRIES = 10;
export const RETRY_INTERVAL = 1000; // 1 second

async function getECPrivateKey(mnemonic: string): Promise<string> {
    const PATH = "m/44'/118'/0'/0/0";

    return bip39.mnemonicToSeed(mnemonic)
        .then((seed: Buffer) => bip32.fromSeed(seed))
        .then((node: BIP32Interface) => node.derivePath(PATH))
        .then((child: BIP32Interface) => bitcoinjs.ECPair.fromPrivateKey(child.privateKey, {compressed: false}))
        .then((ecpair: ECPairInterface) => ecpair.privateKey?.toString('hex'));
}

function getAddress(pubkey: string): string {
    const bytes = util.hash('ripemd160', util.hash('sha256', Buffer.from(pubkey, 'hex')));
    return bech32.encode(BECH32_PREFIX, bech32.toWords(bytes))
}

function makeRandomString(length: number): string {
    const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    return range(0, length).map(() => CHARS[random(0, CHARS.length - 1)]).join('');
}

// this function translates certain characters that are necessary
// in order to sign the string correctly for Cosmos


const sanitizeString = (str: string): string =>
    str.replace(/([&<>])/g, ch => `\\u00${ch.charCodeAt(0).toString(16)}`);

function signTransaction(key: string, data: any, chain_id: string): any {
    let payload = {
        account_number: account_info.account_number || '0',
        chain_id: chain_id,
        fee: util.sortJson(data.value.fee),
        memo: data.value.memo,
        msgs: util.sortJson(data.value.msg),
        sequence: (account_info.sequence?.toString() || '0')
    };

    // Calculate the SHA256 of the payload object
    const jstr = JSON.stringify(payload);
    const sstr = sanitizeString(jstr);
    const jsonHash = util.hash('sha256', Buffer.from(sstr));

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
        sequence: account_info.sequence?.toString()

    }
}


function send_tx(url: string, data: any, chain_id: string): any {
    assert(!!data, ClientErrors.INVALID_TRANSACTION);

    // set up the signature
    data.value.memo = makeRandomString(32);
    const sig = signTransaction(private_key, data, chain_id);
    data.value.signatures = [sig]
    data.value.signature = sig;

    // Post the transaction
    return axios.post(`${url}/${TX_COMMAND}`, {
        headers: {'Content-type': 'application/json'},
        tx: data.value,
        mode: 'block' // wait for tx to be committed
    }).then((res: any) => res.data)
}

async function begin_tx(tx: Transaction): Promise<void> {
    const url = `${app_endpoint}/${tx.ep}`;
    const chain_id = tx.data.BaseReq.chain_id;
    let response, res

    const request = {
        method: tx.type,
        url: url,
        data: tx.data,
        headers: {'Content-type': 'application/json'}
    };

    try {
        // get tx skeleton
        response = await axios(request);

        // set the gas info
        if (tx.max_gas && parseInt(response.data.value.fee.gas) > tx.max_gas) {
            response.data.value.fee.gas = `${tx.max_gas}`;
        }

        if (tx.max_fee) {
            response.data.value.fee.amount = [{'denom': `${TOKEN_NAME}`, 'amount': `${tx.max_fee}`}];
        } else if (tx.gas_price) {
            response.data.value.fee.amount = [{
                'denom': `${TOKEN_NAME}`,
                'amount': `${response.data.value.fee.gas * tx.gas_price}`
            }];
        }
    } catch (err) {
        tx.deferred.reject(new Error(err.message));
        advance_queue();
        return;
    }

    try {
        // broadcast the tx
        res = await send_tx(app_endpoint, response.data, chain_id);
    } catch (err) {
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

    if (!res.code) {
        // bump our sequence number
        account_info.sequence++;

        tx.deferred.resolve(res.data);

        advance_queue();
    } else {
        if (res.raw_log.search("signature verification failed") !== -1) {
            update_account_sequence(tx, MAX_RETRIES);
        } else {
            tx.deferred.reject(new Error(extract_error_from_message(res.raw_log)));
            advance_queue();
        }
    }
}

function update_account_sequence(tx: Transaction, retries: number): void {
    if (retries) {
        setTimeout(async () => {
            // signature fail. Either sequence number or chain id is invalid
            const changed = await sendAccountQuery();
            if (changed) {
                await begin_tx(tx);
            } else {
                update_account_sequence(tx, retries - 1);
            }
        }, RETRY_INTERVAL);
    } else {
        // at this point, assume it's the chain id that is bad
        tx.deferred.reject(new Error("Invalid chain id"));
        advance_queue();
    }
}

function advance_queue(): void {
    tx_queue.shift();
    tx_queue.length && setTimeout(next_tx, 0);
}

function extract_error_from_message(msg: string): string {
    // This is very fragile and will break if Cosmos changes their error format again
    // currently it looks like "unauthorized: Key already exists: failed to execute message; message index: 0"
    // and we just want the "Key already exists" bit. However with some messages, e.g.
    // insufficient fee: insufficient fees; got: 10ubnt required: 2000000ubnt
    // we want most of the message.
    // To deal with this, we will in general extract the message between the first two colons in most cases
    // but will have exceptions for certain cases

    const offset1 = msg.search(": ");

    // If we can't segment the message, just return the whole thing
    if (offset1 == -1) {
        return msg;
    }

    // exception cases
    const prefix = msg.substring(0, offset1);
    switch (prefix) {
        case "insufficient fee":
            return msg.substring(offset1 + 2);

        default:
            break;
    }

    const offset2 = msg.indexOf(':', offset1 + 1);
    return msg.substring(offset1 + 2, offset2);
}

function sendAccountQuery(): Promise<boolean> {
    // Fetch the current state of the account that's signing the transaction
    // We will need its account number and current sequence.

    let url = `${app_endpoint}/auth/accounts/${getAddress(secp256k1.keyFromPrivate(private_key, 'hex').getPublic(true, 'hex'))}`;
    return axios.get(url)
        .then(handleAccountResponse);
}

function handleAccountResponse(response: any): boolean {

    const {account_number, sequence} = response?.data?.result?.value || {};
// TODO: This is temporary - remove after test
    if (!isNumber(account_number) && !isNumber(sequence)) {
        throw('not a number when it should be!!!!!');
    }
    if (isNumber(account_number) && isNumber(sequence)) {
        account_info.account_number = `${account_number}`;

        if (account_info.sequence !== sequence) {
            account_info.sequence = sequence;
            return true;
        }

        return false;
    }

    throw(new Error("Unable to retrieve account information"));
}

function next_tx(): Promise<void> {
    return begin_tx(tx_queue[0]);
}


////////////////////////////////////////////////////////
// exported functions
////////////////////////////////////////////////////////

export const init = async (mnemonic: string, endpoint: string): Promise<any> => {
    app_endpoint = endpoint;
    private_key = await getECPrivateKey(mnemonic);

    await sendAccountQuery();

    return getAddress(secp256k1.keyFromPrivate(private_key, 'hex').getPublic(true, 'hex'))
}

export const sendTransaction = (req_type: string, ep_name: string, data: any, gas_info: GasInfo): Promise<any> => {
    const def = new Deferred();
    const tx = new Transaction(req_type, ep_name, data, def);
    extend(tx, fixupGasInfo(gas_info));

    tx_queue.push(tx);

    tx_queue.length === 1 && setTimeout(next_tx, 0);

    return def.promise;

    function fixupGasInfo({max_gas, max_fee, gas_price}: GasInfo = {}): GasInfo {
        return ({
            max_gas: max_gas?.toString(),
            max_fee: max_fee?.toString(),
            gas_price: gas_price?.toString()
        })
    }
}

export const query = async (url: string): Promise<any> => {
    try {
        return await axios.get(`${app_endpoint}/${url}`)
            .then((res: any) => res.data)
    } catch (error) {
        if (typeof error.response.data === 'string') {
            throw(new Error(error.response.data));
        } else if (typeof error.response.data.error === 'string') {
            try {
                const err = JSON.parse(error.response.data.error);
                throw(new Error(err.message));
            } catch (e) {
                throw(new Error(error.response.data.error));
            }
        } else {
            throw(new Error("An error occurred"));
        }
    }
}

