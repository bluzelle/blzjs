import {bluzelle} from '../../client/lib/bluzelle-node'
import {BluzelleConfig} from "../../client/lib/BluzelleConfig";
import {API} from "../../client/lib/swarmClient/api";

const params: BluzelleConfig = {
    address: "bluzelle1htcd86l00dmkptdja75za0akg8mrt2w3qhd65v",
    mnemonic: "apology antique such ancient spend narrow twin banner coral book iron summer west extend toddler walnut left genius exchange globe satisfy shield case rose",
    endpoint: "http://testnet.public.bluzelle.com:1317",
    chain_id: 'bluzelle',
    uuid: Date.now().toString()
}

bluzelle(params).then(async (bz: API) => {
    window.document.body.innerHTML = 'Creating key...'
    await bz.create('myKey', 'myValue', {gas_price: '10.0'})

    window.document.body.innerHTML = 'Reading key...'
    const result = await bz.read('myKey');
    window.document.body.innerHTML = `result = ${result}`
});
