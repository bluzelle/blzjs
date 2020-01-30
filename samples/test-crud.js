#!/usr/bin/node

const { bluzelle } = require('bluzelle');

var times = [];

const params = {

    // local
    address: 'cosmos17jfr2dqreyfctfga2y4p99vwrypvc4q6usapdj',
    mnemonic: 'uniform tumble fragile define modify boy burger nose lizard hub shine novel brass document aerobic tomorrow jaguar now since sentence person auction dignity miss',
    endpoint: "http://localhost:1317"

    // us-east
    // address: 'cosmos15sf7ymfeww4uxsq6wss39fu6uj3ul0e9z7ryyl',
    // mnemonic: 'quiz album judge jewel expose zero illness feed tube argue protect frozen drip angry waste army spy toddler balcony sad head egg patrol burst'

    // mumbai
    // address: 'cosmos1ry4f9mus6czs2z9l9j2aaee4jpt5sqk54elpkd',
    // mnemonic: 'perfect tag input craft stable uniform favorite dwarf exclude time way power seat dry avocado pelican rapid require slush pink surprise vehicle heavy survey'

};

function now()
{
    var d = new Date();
    return d.getTime();
}

async function do_func(func)
{
    var start = now();

    try
    {
        res = await func();
        if (res)
        {
            console.log("result: " + JSON.stringify(res));
        }
    }
    catch(err)
    {
        console.log("result: " + JSON.stringify(err));
    }
    time_taken = now() - start;
    times.push(time_taken);
    console.log("time taken: " + time_taken + "ms");
}

const main = async () => {

    bz = await bluzelle(params);

    console.log("*** create key/value ***");
    await do_func(async function()
    {
        return bz.create("mykey", "myval");
    });

    console.log("\n*** quick-read (unverified) ***");
    await do_func(async function()
    {
        return bz.quickread("mykey");
    });

    console.log("\n*** update value ***");
    await do_func(async function()
    {
        return bz.update("mykey", "newvalue");
    });

    console.log("\n*** quick-read (unverified) ***");
    await do_func(async function()
    {
        return bz.quickread("mykey");
    });

    console.log("\n*** quick-read (verified) ***");
    await do_func(async function()
    {
        return bz.quickread("mykey", true);
    });

    console.log("\n*** simultaneous unverified and verified quick-read ***");
    p1 = do_func(async function()
    {
        return bz.quickread("mykey");
    });
    p2 = do_func(async function()
    {
        return bz.quickread("mykey", true);
    });
    await Promise.all([p1, p2]);

    console.log("\n*** transactional read ***");
    await do_func(async function()
    {
        return bz.read("mykey");
    });


    console.log("\n*** delete ***");
    await do_func(async function()
    {
        await bz.delete("mykey");
    });
};

main().then(function()
{
    console.log("\n*** summary of times taken:");
    console.log(times);
    console.log("total: " + times.reduce((a, b) => a + b, 0));
});