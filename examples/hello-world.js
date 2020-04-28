#!/usr/bin/node

const {bluzelle} = require('../client/lib/bluzelle-node');

const {bluzelleConfig} = require('./example-config');

(async () => {
    const bz = await bluzelle(bluzelleConfig);

    await bz.create("somekey", "somevalue", {'gas_price': '10.0'})
    console.log(await bz.read("somekey"))
})();

