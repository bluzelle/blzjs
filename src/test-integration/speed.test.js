const {bluzelle, version} = require('../main');
const assert = require('assert');




const log = false;
const entry = 'ws://testnet-dev.bluzelle.com:51010';
const p2p_latency_bound = 100;
const private_pem = 'MHQCAQEEIFH0TCvEu585ygDovjHE9SxW5KztFhbm4iCVOC67h0tEoAcGBSuBBAAKoUQDQgAE9Icrml+X41VC6HTX21HulbJo+pV1mtWn4+evJAi8ZeeLEJp4xg++JHoDm8rQbGWfVM84eqnb/RVuIXqoz6F9Bg==';


// This test is not part of the default test suite
it.skip('100 quickreads', async () => {

    const bz = bluzelle({
        entry, 
        private_pem, 
        uuid: Math.random().toString(),
        log,
        p2p_latency_bound,
    });


    if(await bz.hasDB()) {
        await bz.deleteDB();
    }

    await bz.createDB();
    await bz.create('hello', 'world');
    
    await new Promise(resolve => setTimeout(() => resolve(), 1000));

    console.log('before');

    for(let i = 0; i < 100; i++) {

        const start = new Date().getTime();

        await bz.quickread('hello');

        console.log((new Date().getTime() - start) + 'ms');

    }

    console.log('after');


    bz.close();

}).timeout(10000);
