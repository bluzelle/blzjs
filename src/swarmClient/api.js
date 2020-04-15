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

const assert = require('assert');
const cosmos = require('./cosmos');

const APP_SERVICE = 'crud';
const BLOCK_TIME_IN_SECONDS = 5;

function hex2string(hex) {
  let str = '';
  for (let i = 0; i < hex.length; i += 2)
    str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
  return str;
}

function parseResult(str, reject) {
  try {
    const json = hex2string(str);
    return JSON.parse(json);
  } catch (err) {
    reject(new Error('An error occurred parsing the result'));
  }
}

module.exports = class API {
  constructor(address, mnemonic, endpoint, uuid, chainId /*, ...args */) {
    assert(typeof address === 'string', 'address must be a string');
    assert(typeof mnemonic === 'string', 'mnemonic must be a string');

    this.mnemonic = mnemonic;
    this.address = address;
    this.uuid = uuid;
    this.chain_id = chainId || 'bluzelle';
    this.endpoint = endpoint || 'http://localhost:1317';
  }

  async init() {
    return await cosmos.init(this.mnemonic, this.endpoint, this.address);
  }

  status() {
    console.log('status');
  }

  // returns a promise resolving to nothing.
  async create(key, value, gasInfo, leaseInfo) {
    assert(typeof key === 'string', 'Key must be a string');
    assert(typeof value === 'string', 'Value must be a string');

    const blocks = this.convertLease(leaseInfo);
    if (blocks < 0) {
      throw new Error('Invalid lease time');
    }

    return this.doTx(
      {
        Key: key,
        Value: value,
        Lease: blocks,
      },
      'post',
      'create',
      gasInfo,
      function (res, resolve, reject) {
        resolve();
      }
    );
  }

  // returns a promise resolving to nothing.
  async update(key, value, gasInfo, leaseInfo) {
    assert(typeof key === 'string', 'Key must be a string');
    assert(typeof value === 'string', 'Value must be a string');

    return this.doTx(
      {
        Key: key,
        Value: value,
        Lease: this.convertLease(leaseInfo),
      },
      'post',
      'update',
      gasInfo,
      function (res, resolve, reject) {
        resolve();
      }
    );
  }

  // returns a promise resolving the string value of the key.
  async read(key, prove) {
    assert(typeof key === 'string', 'Key must be a string');

    return new Promise((resolve, reject) => {
      const uriKey = this.encodeSafe(key);
      const url = prove
        ? `${APP_SERVICE}/pread/${this.uuid}/${uriKey}`
        : `${APP_SERVICE}/read/${this.uuid}/${uriKey}`;
      return cosmos
        .query(url)
        .then(function (res) {
          resolve(res.result.value);
        })
        .catch(function (err) {
          // treat 404's specially
          if (err.message.substr(0, 3) === '404') {
            reject(new Error('Key not found'));
          } else {
            reject(err);
          }
        });
    });
  }

  // returns a promise resolving the string value of the key.
  async txRead(key, gasInfo) {
    assert(typeof key === 'string', 'Key must be a string');

    return this.doTx(
      {
        Key: key,
      },
      'post',
      'read',
      gasInfo,
      function (res, resolve, reject) {
        const json = parseResult(res, reject);
        resolve(json.value);
      }
    );
  }

  // returns a promise resolving to nothing.
  async delete(key, gasInfo) {
    assert(typeof key === 'string', 'Key must be a string');

    return this.doTx(
      {
        Key: key,
      },
      'delete',
      'delete',
      gasInfo,
      function (res, resolve, reject) {
        resolve();
      }
    );
  }

  // returns a promise resolving to a boolean value - true or false, representing whether the key is in the database.
  async has(key) {
    assert(typeof key === 'string', 'Key must be a string');

    const uriKey = this.encodeSafe(key);
    return this.doQuery(`${APP_SERVICE}/has/${this.uuid}/${uriKey}`, function (
      res,
      resolve,
      reject
    ) {
      resolve(res.result.has);
    });
  }

  // returns a promise resolving to a boolean value - true or false, representing whether the key is in the database.
  txHas(key, gasInfo) {
    assert(typeof key === 'string', 'Key must be a string');

    return this.doTx(
      {
        Key: key,
      },
      'post',
      'has',
      gasInfo,
      function (res, resolve, reject) {
        const json = parseResult(res, reject);
        resolve(json.has);
      }
    );
  }

  // returns a promise resolving to an array of strings. ex. ["key1", "key2", ...]
  async keys() {
    return this.doQuery(`${APP_SERVICE}/keys/${this.uuid}`, function (
      res,
      resolve,
      reject
    ) {
      resolve(res.result.keys ? res.result.keys : []);
    });
  }

  // returns a promise resolving to an array of strings. ex. ["key1", "key2", ...]
  txKeys(gasInfo) {
    return this.doTx({}, 'post', 'keys', gasInfo, function (
      res,
      resolve,
      reject
    ) {
      const json = parseResult(res, reject);
      resolve(json.keys ? json.keys : []);
    });
  }

  // returns a promise resolving to nothing
  rename(key, newKey, gasInfo) {
    assert(typeof key === 'string', 'Key must be a string');
    assert(typeof newKey === 'string', 'New key must be a string');

    return this.doTx(
      {
        Key: key,
        NewKey: newKey,
      },
      'post',
      'rename',
      gasInfo,
      function (res, resolve, reject) {
        resolve();
      }
    );
  }

  // returns a promise resolving to the number of keys/values
  count() {
    return this.doQuery(`/${APP_SERVICE}/count/${this.uuid}`, function (
      res,
      resolve,
      reject
    ) {
      resolve(parseInt(res.result.count));
    });
  }

  // returns a promise resolving to the number of keys/values
  txCount(gasInfo) {
    return this.doTx({}, 'post', 'count', gasInfo, function (
      res,
      resolve,
      reject
    ) {
      const json = parseResult(res, reject);
      resolve(json.count);
    });
  }

  // returns a promise resolving to nothing
  deleteAll(gasInfo) {
    return this.doTx({}, 'post', 'deleteall', gasInfo, function (
      res,
      resolve,
      reject
    ) {
      resolve();
    });
  }

  // returns a promise resolving to a JSON array containing keys and values
  keyValues() {
    return this.doQuery(`/${APP_SERVICE}/keyvalues/${this.uuid}`, function (
      res,
      resolve,
      reject
    ) {
      resolve(res.result.keyvalues);
    });
  }

  // returns a promise resolving to a JSON array containing keys and values
  txKeyValues(gasInfo) {
    return this.doTx({}, 'post', 'keyvalues', gasInfo, function (
      res,
      resolve,
      reject
    ) {
      const json = parseResult(res, reject);
      resolve(json.keyvalues);
    });
  }

  // returns a promise resolving to nothing.
  async multiUpdate(keyvalues, gasInfo) {
    assert(typeof keyvalues === 'object', 'Keyvalues must be an array');
    keyvalues.forEach(function (value, index, array) {
      assert(typeof value.key === 'string', 'All keys must be strings');
      assert(typeof value.value === 'string', 'All values must be strings');
    });

    return this.doTx(
      {
        KeyValues: keyvalues,
      },
      'post',
      'multiupdate',
      gasInfo,
      function (res, resolve, reject) {
        resolve();
      }
    );
  }

  // returns a promise resolving to an integral value in seconds, representing the lease time remaining on the key
  async getLease(key) {
    assert(typeof key === 'string', 'Key must be a string');

    const uriKey = this.encodeSafe(key);
    return this.doQuery(
      `${APP_SERVICE}/getlease/${this.uuid}/${uriKey}`,
      function (res, resolve, reject) {
        resolve(res.result.lease * BLOCK_TIME_IN_SECONDS);
      }
    );
  }

  // returns a promise resolving to nothing.
  txGetLease(key, gasInfo) {
    assert(typeof key === 'string', 'Key must be a string');

    return this.doTx(
      {
        Key: key,
      },
      'post',
      'getlease',
      gasInfo,
      function (res, resolve, reject) {
        const json = parseResult(res, reject);
        resolve(json.lease * BLOCK_TIME_IN_SECONDS);
      }
    );
  }

  // returns a promise resolving to nothing.
  renewLease(key, gasInfo, leaseInfo) {
    assert(typeof key === 'string', 'Key must be a string');

    const blocks = this.convertLease(leaseInfo);
    if (blocks < 0) {
      throw new Error('Invalid lease time');
    }

    return this.doTx(
      {
        Key: key,
        Lease: blocks,
      },
      'post',
      'renewlease',
      gasInfo,
      function (res, resolve, reject) {
        resolve();
      }
    );
  }

  // returns a promise resolving to nothing.
  renewLeaseAll(gasInfo, leaseInfo) {
    const blocks = this.convertLease(leaseInfo);
    if (blocks < 0) {
      throw new Error('Invalid lease time');
    }

    return this.doTx(
      {
        Lease: blocks,
      },
      'post',
      'renewleaseall',
      gasInfo,
      function (res, resolve, reject) {
        resolve();
      }
    );
  }

  // returns a promise resolving to an array of key/lease-time pairs
  async getNShortestLease(n) {
    if (n < 0) {
      throw new Error('Invalid value specified');
    }

    return this.doQuery(
      `${APP_SERVICE}/getnshortestlease/${this.uuid}/${n}`,
      function (res, resolve, reject) {
        const leaseInfo = [];
        res.result.keyleases.forEach(function (val, i, leases) {
          leaseInfo.push({
            key: leases[i].key,
            lease: leases[i].lease * BLOCK_TIME_IN_SECONDS,
          });
        });
        resolve(leaseInfo);
      }
    );
  }

  // returns a promise resolving to an array of key/lease-time pairs
  txGetNShortestLease(n, gasInfo) {
    if (n < 0) {
      throw new Error('Invalid value specified');
    }

    return this.doTx(
      {
        N: n,
      },
      'post',
      'getnshortestlease',
      gasInfo,
      function (res, resolve, reject) {
        const json = parseResult(res, reject);
        const leaseInfo = [];
        json.keyleases.forEach(function (val, i, leases) {
          leaseInfo.push({
            key: leases[i].key,
            lease: leases[i].lease * BLOCK_TIME_IN_SECONDS,
          });
        });
        resolve(leaseInfo);
      }
    );
  }

  // returns a promise resolving to a JSON object representing the user account data.
  async account() {
    return this.doQuery(`auth/accounts/${this.address}`, function (
      res,
      resolve,
      reject
    ) {
      resolve(res.result.value);
    });
  }

  // returns a promise resolving to a version string.
  async version() {
    return this.doQuery('node_info', function (res, resolve, reject) {
      resolve(res.application_version.version);
    });
  }

  doTx(params, type, cmd, gasInfo, func) {
    const data = {
      BaseReq: {
        from: this.address,
        chain_id: this.chain_id,
      },
      UUID: this.uuid,
      Owner: this.address,
    };

    Object.assign(data, params);

    return new Promise((resolve, reject) => {
      cosmos
        .sendTransaction(type, `${APP_SERVICE}/${cmd}`, data, gasInfo)
        .then(function (res) {
          func(res, resolve, reject);
        })
        .catch(function (err) {
          reject(err);
        });
    });
  }

  doQuery(ep, func) {
    return new Promise((resolve, reject) => {
      cosmos
        .query(ep)
        .then(function (res) {
          func(res, resolve, reject);
        })
        .catch(function (err) {
          reject(err);
        });
    });
  }

  convertLease(leaseInfo) {
    let seconds = 0;
    if (typeof leaseInfo === 'undefined') {
      return '0';
    }

    seconds += leaseInfo.days ? parseInt(leaseInfo.days) * 24 * 60 * 60 : 0;
    seconds += leaseInfo.hours ? parseInt(leaseInfo.hours) * 60 * 60 : 0;
    seconds += leaseInfo.minutes ? parseInt(leaseInfo.minutes) * 60 : 0;
    seconds += leaseInfo.seconds ? parseInt(leaseInfo.seconds) : 0;

    const blocks = seconds / BLOCK_TIME_IN_SECONDS;
    return `${blocks}`;
  }

  encodeSafe(str) {
    const instr = encodeURI(str);
    let outstr = '';
    for (let i = 0; i < instr.length; i++) {
      const ch = instr[i];
      switch (ch) {
        case '#':
        case '?':
          outstr += '%' + ch.charCodeAt(0).toString(16);
          break;

        default:
          outstr += ch;
          break;
      }
    }

    return outstr;
  }
};
