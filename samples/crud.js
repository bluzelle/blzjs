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

const gas_params = config.gas_params;

var bz;

function usage()
{
    console.log("\nUsage: " + process.argv[1] + " command [ argument...]");
    console.log(" Executes a command on a Bluzelle node\n");
    console.log("Commands and arguments:");
    console.log("\n Transactional commands");
    console.log("  create uuid key value   - creates a new key/value");
    console.log("  txread uuid key         - returns the value of an existing key");
    console.log("  update uuid key value   - updates the value of an existing key");
    console.log("  delete uuid key         - deletes an existing key");
    console.log("  rename uuid key newkey  - updates the name of an existing key");
    console.log("  txhas uuid key          - determines if a key exists");
    console.log("  txkeys uuid             - returns a list of all keys");
    console.log("  txcount uuid            - returns the number of keys");
    console.log("  txkeyvalues uuid        - returns a list of all keys and values");
    console.log("  deleteall uuid          - deletes all keys");
    console.log("\n  multiupdate uuid key value [key value]... - updates the value of multiple existing keys");
    console.log("\n Query commands");
    console.log("  read uuid key [prove] - returns the value of an existing key, requiring proof if 'prove' is specified");
    console.log("  has uuid key          - determines if a key exists");
    console.log("  keys uuid             - returns a list of all keys");
    console.log("  keyvalues uuid        - returns a list of all keys and values");
    console.log("  count uuid            - returns the number of keys");
    console.log("\n Miscellaneous commands");
    console.log("  account               - returns information about the currently active account");
    console.log("  version               - returns the version of the Bluzelle service");
    console.log("\n");
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

    try
    {
        bz = await bluzelle({
            address:  config.address,
            mnemonic: config.mnemonic,
            uuid: process.argv[3],
            endpoint: config.endpoint,
            chain_id: config.chain_id
        });

        var res;

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
            case 'rename':
                check_args(5);
                res = await bz.rename(process.argv[4], process.argv[5], gas_params);
                break;
            case 'count':
                check_args(3);
                res = await bz.count();
                break;
            case 'txcount':
                check_args(3);
                res = await bz.txcount(gas_params);
                break;
            case 'deleteall':
                check_args(3);
                res = await bz.deleteall(gas_params);
                break;
            case 'keyvalues':
                check_args(3);
                res = await bz.keyvalues();
                break;
            case 'txkeyvalues':
                check_args(3);
                res = await bz.txkeyvalues(gas_params);
                break;
            case 'multiupdate':
                // number of arguments must be an even number and at least 6
                check_args(5);
                if (process.argv.length % 2)
                {
                    usage();
                    return;
                }

                var kvs = [];
                for (var i = 4; i < process.argv.length; i += 2)
                {
                    kvs.push({key: process.argv[i], value: process.argv[i+1]})
                }
                res = await bz.multiupdate(kvs, gas_params);
                break;
            case 'account':
                check_args(2);
                res = await bz.account();
                break;
            case 'version':
                check_args(2);
                res = await bz.version();
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
