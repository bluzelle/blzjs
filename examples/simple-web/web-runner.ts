import {bluzelle, API} from 'bluzelle'
import {bluzelleConfig} from "../example-config";


bluzelle(bluzelleConfig).then(async (bz: API) => {
    window.document.body.innerHTML = 'Creating key...'
    await bz.create('myKey', 'myValue', {gas_price: 10})

    window.document.body.innerHTML = 'Reading key...'
    const result = await bz.read('myKey');
    window.document.body.innerHTML = `result = ${result}`
});
