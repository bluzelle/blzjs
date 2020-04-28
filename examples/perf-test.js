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


const { bluzelle } = require('../client/lib/bluzelle-node');

// NOTE: This file must be provided and contains your account credentials in the form
//  module.exports = {
//         address: 'bluzellexxxxxxxxxxxxxxxxxxx',
//         mnemonic: 'set of words representing your private key',
//         endpoint: "address/port of your rest-proxy, e.g. http://localhost:1317",
//         chain_id: "bluzelle"
//  };
const config = require('./blz-config.js');

var times = [];
var payload_size = 10;
var payload_set = false;

const gas_params = config.gas_params;

// NOTE: you must fill in the information below with valid values
// if uuid is not specified, the value of "address" will be used as the uuid
const params =
{
    address:  config.address,
    mnemonic: config.mnemonic,
    uuid: "my_uuid",
    endpoint: config.endpoint,
    chain_id: config.chain_id
};

function now()
{
    var d = new Date();
    return d.getTime();
}

async function do_func(label, func)
{
    payload_set || console.log(label);
    var start = now();

    try
    {
        res = await func();
        if (typeof res != 'undefined')
        {
            payload_set || console.log("result: " + JSON.stringify(res));
        }
        else
        {
            payload_set || console.log("success");
        }

    }
    catch(err)
    {
        console.log("error: " + err.message);
    }
    time_taken = now() - start;
    times.push(time_taken);
    payload_set || console.log("time taken: " + time_taken + "ms");
}

async function main()
{
    if (process.argv.length > 2)
    {
        payload_size = parseInt(process.argv[2]);
        console.log("Payload size: " + payload_size);
        payload_set = true;
    }

    try
    {
        bz = await bluzelle(params);
    }
    catch (err)
    {
        console.log(err.message);
        return;
    }

    await do_func("*** create key/value ***", async function()
    {
        return bz.create("mykey", '#'.repeat(payload_size), gas_params);
    });

    await do_func("\n*** read (unverified) ***", async function()
    {
        return bz.read("mykey");
    });

    await do_func("\n*** update value ***", async function()
    {
        return bz.update("mykey", '*'.repeat(payload_size), gas_params);
    });

    await do_func("\n*** read (unverified) ***", async function()
    {
        return bz.read("mykey");
    });

    await do_func("\n*** read (verified) ***", async function()
    {
        return bz.read("mykey", true);
    });

    p1 = do_func("\n*** simultaneous unverified and verified read ***", async function()
    {
        return bz.read("mykey");
    });
    p2 = do_func("", async function()
    {
        return bz.read("mykey", true);
    });
    await Promise.all([p1, p2]);

    await do_func("\n*** transactional read ***", async function()
    {
        return bz.txRead("mykey", gas_params);
    });

    await do_func("\n*** delete ***", async function()
    {
        await bz.delete("mykey", gas_params);
    });
};

main().then(function()
{
    console.log("\n*** summary of times taken:");
    console.log(times);
    console.log("total: " + times.reduce((a, b) => a + b, 0));
});
