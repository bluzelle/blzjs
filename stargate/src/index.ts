import {bluzelle} from "./bluzelle-node";

const bz = bluzelle({
    mnemonic: "action twelve cream wash grocery trade forget conduct rare parrot behind uphold marine focus repair decline venture ring mail useless school impose large blame",
    endpoint: 'http://localhost:26657',
    uuid: 'my-uuid'
});



bz.upsert('foo1', 'bar', {gas_price: 0.002})
    .then(x => console.log(x))
    .catch(e => console.log(e))
    .then(() => console.log("Key created"))
    .then(() => bz.read('foo1'))
    .then(v => console.log('VALUE:', v))
   .then(() => bz.delete('foo1', {gas_price: 0.002}))
    .then(x => console.log(x))
    .catch(e => console.log(e))
    .then(() => console.log('Key deleted'))
    .then(() => bz.read('foo1'))
    .then(v => console.log('Value: ', v))



