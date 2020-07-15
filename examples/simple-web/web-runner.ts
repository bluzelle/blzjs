import {bluzelle, API} from 'bluzelle'
const {bluzelleConfig} = require("../example-config");


const bz: API = bluzelle(bluzelleConfig);
    window.document.body.innerHTML = 'Creating key...'

    bz.create('myKey', 'myValue', {gas_price: 10})
        .then(() => window.document.body.innerHTML = 'Reading key...')
        .then(() => bz.read('myKey'))
        .then(result => window.document.body.innerHTML = `result = ${result}`);
