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

// NOTE: You may need to set the gas parameters based on your configuration
// const gas_params = {'max_gas': '', 'max_fee': '', 'gas_price': ''};
const gas_params = {'gas_price': '0.01'};

var bz;

function usage()
{
    console.log("\nUsage: " + process.argv[1] + " command [ argument...]\n");
    console.log("Executes a command on a Bluzelle node");
    console.log("Commands and arguments:");
    console.log(" create key value - creates a new key/value");
    console.log(" read key         - returns the value of an existing key");
    console.log(" update key value - updates the value of an existing key");
    console.log(" delete key value - deletes an existing key");
    console.log(" has key          - determines if a key exists");
    console.log(" keys             - returns a list of all keys");
}

const main = async () => {

    // NOTE: you must fill in the credential below with valid values
    bz = await bluzelle({
        address: 'bluzelle1xhz23a58mku7ch3hx8f9hrx6he6gyujq57y3kp',
        mnemonic: 'volcano arrest ceiling physical concert sunset absent hungry tobacco canal census era pretty car code crunch inside behind afraid express giraffe reflect stadium luxury',
        endpoint: "http://localhost:1317",
        chain_id: "bluzelle"
    });

    try
    {
        switch (process.argv[2])
        {
            case 'create':
                res = await bz.create(process.argv[3], process.argv[4], gas_params);
                break;
            case 'read':
                res = await bz.read(process.argv[3], gas_params);
                break;
            case 'update':
                res = await bz.update(process.argv[3], process.argv[4], gas_params);
                break;
            case 'delete':
                res = await bz.delete(process.argv[3], gas_params);
                break;
            case 'has':
                res = await bz.has(process.argv[3], gas_params);
                break;
            case 'keys':
                res = await bz.keys(gas_params);
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
