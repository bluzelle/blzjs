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
const axios = require('axios');
const { ec: EC } = require('elliptic');
const bech32 = require('bech32');

const bitcoinjs = require('bitcoinjs-lib');
const bip32 = require('bip32');
const bip39 = require('bip39');

let API_ENDPOINT = 'http://localhost:1317';
const TX_COMMAND = 'txs';

const secp256k1 = new EC('secp256k1');

const prefix = 'bluzelle';
const path = "m/44'/118'/0'/0/0"; // eslint-disable-line quotes

let PRIVATE_KEY;
const ACCOUNT_INFO = { account_number: '', sequence: '' };
const TX_QUEUE = [];

const TOKEN_NAME = 'ubnt';
const MAX_RETRIES = 10;
const RETRY_INTERVAL = 1000; // 1 second

async function getECPrivateKey(mnemonic) {
  const seed = await bip39.mnemonicToSeed(mnemonic);
  const node = await bip32.fromSeed(seed);
  const child = node.derivePath(path);
  const ecpair = bitcoinjs.ECPair.fromPrivateKey(child.privateKey, {
    compressed: false,
  });
  return ecpair.privateKey.toString('hex');
}

function getAddress(pubkey) {
  const bytes = util.hash(
    'ripemd160',
    util.hash('sha256', Buffer.from(pubkey, 'hex'))
  );
  return bech32.encode(prefix, bech32.toWords(bytes));
}

function makeRandomString(length) {
  let result = '';
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

class deferred {
  constructor() {
    this.promise = new Promise((resolve, reject) => {
      this.reject = reject;
      this.resolve = resolve;
    });
  }
}

class Transaction {
  constructor(reqType, epName, data, def) {
    this.type = reqType;
    this.ep = epName;
    this.data = data;
    this.deferred = def;
    this.gas_price = 0;
    this.max_gas = 0;
    this.max_fee = 0;
    this.retries_left = MAX_RETRIES;
  }
}

// this function translates certain characters that are necessary
// in order to sign the string correctly for Cosmos
function sanitizeString(str) {
  let outstr = '';
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    switch (ch) {
      case '&':
      case '<':
      case '>':
        outstr += '\\u00' + ch.charCodeAt(0).toString(16);
        break;
      default:
        outstr += ch;
        break;
    }
  }

  return outstr;
}

function signTransaction(key, data, chainId) {
  const payload = {
    account_number: ACCOUNT_INFO.account_number || '0',
    chain_id: chainId,
    fee: util.sortJson(data.value.fee),
    memo: data.value.memo,
    msgs: util.sortJson(data.value.msg),
    sequence: ACCOUNT_INFO.sequence || '0',
  };

  // Calculate the SHA256 of the payload object
  const jstr = JSON.stringify(payload);
  const sstr = sanitizeString(jstr);
  const jsonHash = util.hash('sha256', Buffer.from(sstr));

  return {
    pub_key: {
      type: 'tendermint/PubKeySecp256k1',
      value: Buffer.from(
        secp256k1.keyFromPrivate(key, 'hex').getPublic(true, 'hex'),
        'hex'
      ).toString('base64'),
    },

    // We have to convert the signature to the format that Tendermint uses
    signature: util
      .convertSignature(
        secp256k1.sign(jsonHash, key, 'hex', {
          canonical: true,
        })
      )
      .toString('base64'),

    account_number: ACCOUNT_INFO.account_number,
    sequence: ACCOUNT_INFO.sequence,
  };
}

async function sendTx(url, data, chainId) {
  if (!data) {
    throw Error('Invalid transaction.');
  }

  // set up the signature
  data.value.signatures = [];
  data.value.memo = makeRandomString(32);
  const sig = signTransaction(PRIVATE_KEY, data, chainId);
  data.value.signatures.push(sig);
  data.value.signature = sig;

  // Post the transaction
  const res = await axios.post(`${url}/${TX_COMMAND}`, {
    headers: { 'Content-type': 'application/x-www-form-urlencoded' },
    tx: data.value,
    mode: 'block', // wait for tx to be committed
  });

  return res.data;
}

async function beginTx(tx) {
  const url = API_ENDPOINT + '/' + tx.ep;
  const chainId = tx.data.BaseReq.chain_id;

  const request = {
    method: tx.type,
    url: url,
    data: tx.data,
    headers: { 'Content-type': 'application/x-www-form-urlencoded' },
  };

  let response;
  let res;
  try {
    // get tx skeleton
    response = await axios(request);

    // set the gas info
    if (
      tx.max_gas &&
      parseInt(response.data.value.fee.gas) > parseInt(tx.max_gas)
    ) {
      response.data.value.fee.gas = `${tx.max_gas}`;
    }

    if (tx.max_fee) {
      response.data.value.fee.amount = [
        { denom: `${TOKEN_NAME}`, amount: `${tx.max_fee}` },
      ];
    } else if (tx.gas_price) {
      response.data.value.fee.amount = [
        {
          denom: `${TOKEN_NAME}`,
          amount: `${response.data.value.fee.gas * tx.gas_price}`,
        },
      ];
    }
  } catch (err) {
    tx.deferred.reject(new Error(err.message));
    advanceQueue();
    return;
  }

  try {
    // broadcast the tx
    res = await sendTx(API_ENDPOINT, response.data, chainId);
  } catch (err) {
    tx.deferred.reject(new Error(err.message));
    advanceQueue();
    return;
  }

  // note - as of right now (3/6/20) the responses returned by the Cosmos REST interface now look like this:
  // eslint-disable-next-line
  // success case: {"height":"0","txhash":"3F596D7E83D514A103792C930D9B4ED8DCF03B4C8FD93873AB22F0A707D88A9F","raw_log":"[]"}
  // failure case: {"height":"0","txhash":"DEE236DEF1F3D0A92CB7EE8E442D1CE457EE8DB8E665BAC1358E6E107D5316AA","code":4,
  //  "raw_log":"unauthorized: signature verification failed; verify correct account sequence and chain-id"}
  //
  // This is far from ideal, doesn't match their docs, and is probably going to change (again) in the future.
  //

  if (!res.code) {
    // bump our sequence number
    ACCOUNT_INFO.sequence = `${++ACCOUNT_INFO.sequence}`;

    tx.deferred.resolve(res.data);

    advanceQueue();
  } else {
    if (res.raw_log.search('signature verification failed') !== -1) {
      updateAccountSequence(tx, MAX_RETRIES);
    } else {
      tx.deferred.reject(new Error(extractErrorFromMessage(res.raw_log)));
      advanceQueue();
    }
  }
}

function updateAccountSequence(tx, retries) {
  if (retries) {
    setTimeout(async function () {
      // signature fail. Either sequence number or chain id is invalid
      const changed = await sendAccountQuery();
      if (changed) {
        await beginTx(tx);
      } else {
        updateAccountSequence(tx, retries - 1);
      }
    }, RETRY_INTERVAL);
  } else {
    // at this point, assume it's the chain id that is bad
    tx.deferred.reject(new Error('Invalid chain id'));
    advanceQueue();
  }
}

function advanceQueue() {
  TX_QUEUE.shift();
  if (TX_QUEUE.length) {
    setTimeout(function () {
      nextTx();
    });
  }
}

function extractErrorFromMessage(msg) {
  // This is very fragile and will break if Cosmos changes their error format again
  // currently it looks like "unauthorized: Key already exists: failed to execute message; message index: 0"
  // and we just want the "Key already exists" bit. However with some messages, e.g.
  // insufficient fee: insufficient fees; got: 10ubnt required: 2000000ubnt
  // we want most of the message.
  // To deal with this, we will in general extract the message between the first two colons in most cases
  // but will have exceptions for certain cases

  const offset1 = msg.search(': ');

  // If we can't segment the message, just return the whole thing
  if (offset1 === -1) {
    return msg;
  }

  // exception cases
  const prefix = msg.substring(0, offset1);
  switch (prefix) {
    case 'insufficient fee':
      return msg.substring(offset1 + 2);

    default:
      break;
  }

  const offset2 = msg.indexOf(':', offset1 + 1);
  return msg.substring(offset1 + 2, offset2);
}

async function sendAccountQuery() {
  // Fetch the current state of the account that's signing the transaction
  // We will need its account number and current sequence.

  const url = `${API_ENDPOINT}/auth/accounts/${getAddress(
    secp256k1.keyFromPrivate(PRIVATE_KEY, 'hex').getPublic(true, 'hex')
  )}`;
  const response = await axios.get(url);
  return handleAccountResponse(response);
}

function handleAccountResponse(response) {
  const state = response.data;

  if (
    state &&
    state.result &&
    state.result.value.account_number &&
    state.result.value.sequence
  ) {
    ACCOUNT_INFO.account_number = `${state.result.value.account_number}`;
    if (ACCOUNT_INFO.sequence !== `${state.result.value.sequence}`) {
      ACCOUNT_INFO.sequence = `${state.result.value.sequence}`;
      return true;
    }
    return false;
  }

  throw new Error('Unable to retrieve account information');
}

async function nextTx() {
  await beginTx(TX_QUEUE[0]);
}

/// /////////////////////////////////////////////////////
// exported functions
/// /////////////////////////////////////////////////////

async function init(mnemonic, endpoint, address) {
  API_ENDPOINT = endpoint || API_ENDPOINT;
  PRIVATE_KEY = await getECPrivateKey(mnemonic);

  // validate address against mnemonic
  if (
    getAddress(
      secp256k1.keyFromPrivate(PRIVATE_KEY, 'hex').getPublic(true, 'hex')
    ) !== address
  ) {
    return Promise.reject(
      new Error('Bad credentials - verify your address and mnemonic')
    );
  }

  await sendAccountQuery();
}

async function sendTransaction(reqType, epName, data, gasInfo) {
  const def = new deferred(); // eslint-disable-line new-cap
  const tx = new Transaction(reqType, epName, data, def);
  if (gasInfo) {
    if (gasInfo.max_gas) {
      tx.max_gas = gasInfo.max_gas;
    }
    if (gasInfo.max_fee) {
      tx.max_fee = gasInfo.max_fee;
    }
    if (gasInfo.gas_price) {
      tx.gas_price = gasInfo.gas_price;
    }
  }

  TX_QUEUE.push(tx);
  if (TX_QUEUE.length === 1) {
    setTimeout(function () {
      nextTx();
    });
  }

  return def.promise;
}

async function query(ep) {
  return new Promise((resolve, reject) => {
    try {
      return axios
        .get(`${API_ENDPOINT}/${ep}`)
        .then((res) => resolve(res.data));
    } catch (error) {
      if (typeof error.response.data === 'string') {
        reject(new Error(error.response.data));
      } else if (typeof error.response.data.error === 'string') {
        try {
          const err = JSON.parse(error.response.data.error);
          reject(new Error(err.message));
        } catch (e) {
          reject(new Error(error.response.data.error));
        }
      } else {
        reject(new Error('An error occurred'));
      }
    }
  });
}

module.exports = {
  init,
  sendTransaction,
  query,
  sanitizeString,
  MAX_RETRIES,
  RETRY_INTERVAL,
};
