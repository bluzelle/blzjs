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

// NOTE: You may need to set the gas parameters based on your configuration
// const gas_params = {'max_gas': '', 'max_fee': '', 'gas_price': ''};
const gas_params = {'gas_price': '0.01'};

var bz;

function usage()
{
    console.log("\nUsage: " + process.argv[1] + " command [ argument...]");
    console.log(" Executes a command on a Bluzelle node\n");
    console.log("Commands and arguments:");
    console.log("\n Transactional commands");
    console.log("  create uuid key value - creates a new key/value");
    console.log("  txread uuid key         - returns the value of an existing key");
    console.log("  update uuid key value - updates the value of an existing key");
    console.log("  delete uuid key       - deletes an existing key");
    console.log("  txhas uuid key          - determines if a key exists");
    console.log("  txkeys uuid             - returns a list of all keys");
    console.log("\n Query commands");
    console.log("  read uuid key [prove] - returns the value of an existing key, requiring proof if 'prove' is specified");
    console.log("  has uuid key          - determines if a key exists");
    console.log("  keys uuid             - returns a list of all keys\n");
}

function check_args(num)
{
    for (var i = 2; i <= num; i++)
    {
        if (typeof process.argv[i] !== 'string')
        {
            console.log(i)
            usage();
            process.exit();
        }
    }
}

const main = async () => {

    bz = await bluzelle({
        address:  config.address,
        mnemonic: config.mnemonic,
        uuid: process.argv[3],
        endpoint: config.endpoint,
        chain_id: config.chain_id
    });

    try
    {
        switch (process.argv[2])
        {
            case 'create':
                check_args(5);
                res = await bz.create(process.argv[4], process.argv[5], gas_params);
                break;
            case 'txread':
                check_args(4);
                res = await bz.txread(process.argv[4], gas_params);
                break;
            case 'update':
                check_args(5);
                res = await bz.update(process.argv[4], process.argv[5], gas_params);
                break;
            case 'delete':
                check_args(4);
                res = await bz.delete(process.argv[4], gas_params);
                break;
            case 'txhas':
                check_args(4);
                res = await bz.txhas(process.argv[4], gas_params);
                break;
            case 'txkeys':
                check_args(3);
                res = await bz.txkeys(gas_params);
                break;
            case 'read':
                check_args(4);
                if (process.argv[5] && process.argv[5] !== 'prove')
                {
                    console.log(`Error: Invalid argument '${process.argv[5]}'\n`)
                    return;
                }
                res = await bz.read(process.argv[4], process.argv[5] ? true : false);
                break;
            case 'has':
                check_args(4);
                res = await bz.has(process.argv[4]);
                break;
            case 'keys':
                check_args(3);
                res = await bz.keys();
                break;
            default:
                usage();
                return;
        }

        console.log(typeof res != 'undefined' ? res : "success");
    }
    catch(e)
    {
        console.error(e.message);
    }
};


main();
