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

var times = [];
var payload_size = 10;
var payload_set = false;

// const gas_params = {'max_gas': '', 'max_fee': '', 'gas_price': ''};
const gas_params = {'gas_price': '0.01'};

const params =
{
    // local
    address: 'cosmos1zuxcvpkxlzf37dh4k95e2rujmy9sxqvxhaj5pn',
    mnemonic: 'desert maple evoke popular trumpet beach primary decline visit enhance dish drink excite setup public forward ladder girl end genre symbol alter category choose',
    endpoint: "http://localhost:1317",
    chain_id: "bluzelle"
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
        if (res)
        {
            payload_set || console.log("result: " + JSON.stringify(res));
        }
    }
    catch(err)
    {
        console.log("result: " + JSON.stringify(err));
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

    bz = await bluzelle(params);

    await do_func("*** create key/value ***", async function()
    {
        return bz.create("mykey", '#'.repeat(payload_size), gas_params);
    });
    //
    // await do_func("\n*** quick-read (unverified) ***", async function()
    // {
    //     return bz.quickread("mykey");
    // });
    //
    // await do_func("\n*** update value ***", async function()
    // {
    //     return bz.update("mykey", '*'.repeat(payload_size), gas_params);
    // });

    // await do_func("\n*** quick-read (unverified) ***", async function()
    // {
    //     return bz.quickread("mykeyxx");
    // });

    // await do_func("\n*** quick-read (verified) ***", async function()
    // {
    //     return bz.quickread("mykey", true);
    // });
    //
    // p1 = do_func("\n*** simultaneous unverified and verified quick-read ***", async function()
    // {
    //     return bz.quickread("mykey");
    // });
    // p2 = do_func("", async function()
    // {
    //     return bz.quickread("mykey", true);
    // });
    // await Promise.all([p1, p2]);
    //
    // await do_func("\n*** transactional read ***", async function()
    // {
    //     return bz.read("mykey", gas_params);
    // });
    //
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