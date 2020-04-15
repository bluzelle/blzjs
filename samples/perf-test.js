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
const times = [];
const { gas_params: GAS_PARAMS } = config;
let PAYLOAD_SIZE = 10;
let PAYLOAD_SET = false;
let BZ;

// NOTE: you must fill in the information below with valid values
// if uuid is not specified, the value of "address" will be used as the uuid
const params = {
  address: config.address,
  mnemonic: config.mnemonic,
  uuid: 'my_uuid',
  endpoint: config.endpoint,
  chain_id: config.chain_id,
};

function now() {
  const d = new Date();
  return d.getTime();
}

async function doFunc(label, func) {
  PAYLOAD_SET || console.log(label);
  const start = now();

  try {
    const res = await func();
    if (typeof res !== 'undefined') {
      PAYLOAD_SET || console.log('result: ' + JSON.stringify(res));
    } else {
      PAYLOAD_SET || console.log('success');
    }
  } catch (err) {
    console.log('error: ' + err.message);
  }
  const timeTaken = now() - start;
  times.push(timeTaken);
  PAYLOAD_SET || console.log('time taken: ' + timeTaken + 'ms');
}

async function main() {
  if (process.argv.length > 2) {
    PAYLOAD_SIZE = parseInt(process.argv[2]);
    console.log('Payload size: ' + PAYLOAD_SIZE);
    PAYLOAD_SET = true;
  }

  try {
    BZ = await bluzelle(params);
  } catch (err) {
    console.log(err.message);
    return;
  }

  await doFunc('*** create key/value ***', async function () {
    return BZ.create('mykey', '#'.repeat(PAYLOAD_SIZE), GAS_PARAMS);
  });

  await doFunc('\n*** read (unverified) ***', async function () {
    return BZ.read('mykey');
  });

  await doFunc('\n*** update value ***', async function () {
    return BZ.update('mykey', '*'.repeat(PAYLOAD_SIZE), GAS_PARAMS);
  });

  await doFunc('\n*** read (unverified) ***', async function () {
    return BZ.read('mykey');
  });

  await doFunc('\n*** read (verified) ***', async function () {
    return BZ.read('mykey', true);
  });

  const p1 = doFunc(
    '\n*** simultaneous unverified and verified read ***',
    async function () {
      return BZ.read('mykey');
    }
  );
  const p2 = doFunc('', async function () {
    return BZ.read('mykey', true);
  });
  await Promise.all([p1, p2]);

  await doFunc('\n*** transactional read ***', async function () {
    return BZ.txRead('mykey', GAS_PARAMS);
  });

  await doFunc('\n*** delete ***', async function () {
    await BZ.delete('mykey', GAS_PARAMS);
  });
}

main().then(function () {
  console.log('\n*** summary of times taken:');
  console.log(times);
  console.log('total: ' + times.reduce((a, b) => a + b, 0));
});
