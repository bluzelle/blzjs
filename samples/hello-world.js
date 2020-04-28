#!/usr/bin/node

const { bluzelle } = require('../client/lib/bluzelle-node');
const config = require('./blz-config.js');

// const gas_params = {'gas_price': '0.01'};


(async () => {
    const bz =  await bluzelle({
        address:  config.address,
        mnemonic: config.mnemonic,
        uuid: Date.now().toString(),
        endpoint: config.endpoint,
        chain_id: config.chain_id
    });

    try {
    	await bz.create("somekey", "somevalue", config.gas_params)
            .then(res => console.log(res || 'success'))

        await bz.read("somekey", false)
            .then(res => console.log(res || 'success'))

    } catch(e) {
        console.error(e.message);
    }
})();

