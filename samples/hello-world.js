#!/usr/bin/node

const {bluzelle} = require('../client/lib/bluzelle-node');

const config = {
    address: "bluzelle1htcd86l00dmkptdja75za0akg8mrt2w3qhd65v",
    mnemonic: "apology antique such ancient spend narrow twin banner coral book iron summer west extend toddler walnut left genius exchange globe satisfy shield case rose",
    endpoint: "http://testnet.public.bluzelle.com:1317",
    chain_id: 'bluzelle',
    uuid: Date.now().toString()
};

(async () => {
    const bz = await bluzelle(config);

    await bz.create("somekey", "somevalue", {'gas_price': '10.0'})
    console.log(await bz.read("somekey"))
})();

