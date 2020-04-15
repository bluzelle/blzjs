#!/usr/bin/node

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

const { bluzelle } = require('../src/main.js');

// NOTE: This file must be provided and contains your account credentials in the form
//  module.exports = {
//         address: 'bluzellexxxxxxxxxxxxxxxxxxx',
//         mnemonic: 'set of words representing your private key',
//         endpoint: "address/port of your rest-proxy, e.g. http://localhost:1317",
//         chain_id: "bluzelle"
//  };
const config = require('./blz-config.js');

const GAS_PARAMS = config.GAS_PARAMS;
let BZ;

function usage() {
  console.log('\nUsage: ' + process.argv[1] + ' command [ argument...]');
  console.log(' Executes a command on a Bluzelle node\n');
  console.log('Commands and arguments:');
  console.log('\n Transactional commands');
  console.log(
    '  create uuid key value [lease] - creates a new key/value, optionally with a lease (in seconds)'
  );
  console.log(
    '  txRead uuid key               - returns the value of an existing key'
  );
  console.log(
    '  update uuid key value [lease] - updates the value of an existing key, optionally with a lease (in seconds)'
  );
  console.log('  delete uuid key               - deletes an existing key');
  console.log(
    '  rename uuid key newkey        - updates the name of an existing key'
  );
  console.log('  txHas uuid key                - determines if a key exists');
  console.log('  txKeys uuid                   - returns a list of all keys');
  console.log('  txCount uuid                  - returns the number of keys');
  console.log(
    '  txKeyValues uuid              - returns a list of all keys and values'
  );
  console.log('  deleteAll uuid                - deletes all keys');
  console.log(
    '  txGetLease uuid key           - returns the lease time (in seconds) remaining for a key'
  );
  console.log(
    '  renewLease uuid key           - updates the lease time for a key, optionally with a lease (in seconds)'
  );
  console.log(
    '  renewLeaseAll uuid [lease]    - updates the lease time for all keys, optionally with a lease (in seconds)'
  );
  console.log(
    '  txGetNShortestLease uuid n    - returns the n keys/leases with the shortest least time'
  );

  console.log(
    '\n  multiUpdate uuid key value [key value]... - updates the value of multiple existing keys'
  );
  console.log('\n Query commands');
  console.log(
    "  read uuid key [prove]    - returns the value of an existing key, requiring proof if 'prove' is specified" // eslint-disable-line
  );
  console.log('  has uuid key             - determines if a key exists');
  console.log('  keys uuid                - returns a list of all keys');
  console.log(
    '  keyValues uuid           - returns a list of all keys and values'
  );
  console.log('  count uuid               - returns the number of keys');
  console.log(
    '  getLease uuid key        - returns the lease time (in seconds) remaining for a key'
  );
  console.log(
    '  getNShortestLease uuid n - returns the n keys/leases with the shortest least time'
  );
  console.log('\n Miscellaneous commands');
  console.log(
    '  account               - returns information about the currently active account'
  );
  console.log(
    '  version               - returns the version of the Bluzelle service'
  );
  console.log('\n');
}

function checkArgs(num) {
  for (let i = 2; i <= num; i++) {
    if (typeof process.argv[i] !== 'string') {
      console.log(i);
      usage();
      process.exit();
    }
  }
}

function makeLease(arg) {
  let lease;
  if (process.argv.length > arg) {
    lease = { seconds: `${process.argv[arg]}` };
  }

  return lease;
}
const main = async () => {
  try {
    BZ = await bluzelle({
      address: config.address,
      mnemonic: config.mnemonic,
      uuid: process.argv[3],
      endpoint: config.endpoint,
      chain_id: config.chain_id,
    });

    let res;

    switch (process.argv[2]) {
      case 'create':
        checkArgs(5);
        res = await BZ.create(
          process.argv[4],
          process.argv[5],
          GAS_PARAMS,
          makeLease(6)
        );
        break;
      case 'txRead':
        checkArgs(4);
        res = await BZ.txRead(process.argv[4], GAS_PARAMS);
        break;
      case 'update':
        checkArgs(5);
        res = await BZ.update(
          process.argv[4],
          process.argv[5],
          GAS_PARAMS,
          makeLease(6)
        );
        break;
      case 'delete':
        checkArgs(4);
        res = await BZ.delete(process.argv[4], GAS_PARAMS);
        break;
      case 'txHas':
        checkArgs(4);
        res = await BZ.txHas(process.argv[4], GAS_PARAMS);
        break;
      case 'txKeys':
        checkArgs(3);
        res = await BZ.txKeys(GAS_PARAMS);
        break;
      case 'read':
        checkArgs(4);
        if (process.argv[5] && process.argv[5] !== 'prove') {
          console.log(`Error: Invalid argument '${process.argv[5]}'\n`);
          return;
        }
        res = await BZ.read(process.argv[4], !!process.argv[5]);
        break;
      case 'has':
        checkArgs(4);
        res = await BZ.has(process.argv[4]);
        break;
      case 'keys':
        checkArgs(3);
        res = await BZ.keys();
        break;
      case 'rename':
        checkArgs(5);
        res = await BZ.rename(process.argv[4], process.argv[5], GAS_PARAMS);
        break;
      case 'count':
        checkArgs(3);
        res = await BZ.count();
        break;
      case 'txCount':
        checkArgs(3);
        res = await BZ.txCount(GAS_PARAMS);
        break;
      case 'deleteAll':
        checkArgs(3);
        res = await BZ.deleteAll(GAS_PARAMS);
        break;
      case 'keyValues':
        checkArgs(3);
        res = await BZ.keyValues();
        break;
      case 'txKeyValues':
        checkArgs(3);
        res = await BZ.txKeyValues(GAS_PARAMS);
        break;
      case 'multiUpdate': {
        // number of arguments must be an even number and at least 6
        checkArgs(5);
        if (process.argv.length % 2) {
          usage();
          return;
        }

        const kvs = [];
        for (let i = 4; i < process.argv.length; i += 2) {
          kvs.push({ key: process.argv[i], value: process.argv[i + 1] });
        }
        res = await BZ.multiUpdate(kvs, GAS_PARAMS);
        break;
      }
      case 'getLease':
        checkArgs(4);
        res = (await BZ.getLease(process.argv[4], GAS_PARAMS)) + ' seconds';
        break;
      case 'txGetLease':
        checkArgs(4);
        res = (await BZ.txGetLease(process.argv[4], GAS_PARAMS)) + ' seconds';
        break;
      case 'renewLease':
        checkArgs(4);
        res = await BZ.renewLease(process.argv[4], GAS_PARAMS, makeLease(5));
        break;
      case 'renewLeaseAll':
        checkArgs(3);
        res = await BZ.renewLeaseAll(GAS_PARAMS, makeLease(4));
        break;
      case 'getNShortestLease':
        checkArgs(4);
        res = await BZ.getNShortestLease(process.argv[4], GAS_PARAMS);
        break;
      case 'txGetNShortestLease':
        checkArgs(4);
        res = await BZ.txGetNShortestLease(process.argv[4], GAS_PARAMS);
        break;
      case 'account':
        checkArgs(2);
        res = await BZ.account();
        break;
      case 'version':
        checkArgs(2);
        res = await BZ.version();
        break;
      default:
        usage();
        return;
    }

    console.log(typeof res !== 'undefined' ? res : 'success');
  } catch (e) {
    console.error(e.message);
  }
};

main();
