#!/usr/bin/node

const { bluzelle } = require('bluzelle');

var times = [];
var payload_size = 10;
var payload_set = false;

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

const main = async () => {

    if (process.argv.length > 2)
    {
        payload_size = parseInt(process.argv[2]);
        console.log("Payload size: " + payload_size);
        payload_set = true;
    }

    bz = await bluzelle(params);

    await do_func("*** create key/value ***", async function()
    {
        return bz.create("mykey", '#'.repeat(payload_size));
    });

    await do_func("\n*** quick-read (unverified) ***", async function()
    {
        return bz.quickread("mykey");
    });

    await do_func("\n*** update value ***", async function()
    {
        return bz.update("mykey", '*'.repeat(payload_size));
    });

    await do_func("\n*** quick-read (unverified) ***", async function()
    {
        return bz.quickread("mykey");
    });

    await do_func("\n*** quick-read (verified) ***", async function()
    {
        return bz.quickread("mykey", true);
    });

    p1 = do_func("\n*** simultaneous unverified and verified quick-read ***", async function()
    {
        return bz.quickread("mykey");
    });
    p2 = do_func("", async function()
    {
        return bz.quickread("mykey", true);
    });
    await Promise.all([p1, p2]);

    await do_func("\n*** transactional read ***", async function()
    {
        return bz.read("mykey");
    });


    await do_func("\n*** delete ***", async function()
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