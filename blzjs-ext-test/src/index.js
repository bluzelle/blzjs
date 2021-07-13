import {bluzelle} from 'bluzelle';
import {SigningAgents} from "bluzelle/lib/API";

const uuid = Date.now().toString();


const bz = bluzelle({
    mnemonic: "cross paper crucial force warfare marble close brave broom coffee real ten apology design never retire mesh maid know reform decorate bonus crush suspect",
    endpoint: "https://client.sentry.testnet.public.bluzelle.com:1317",
    uuid: uuid,
    signing_agent: SigningAgents.EXTENSION
//    signing_agent: SigningAgents.INTERNAL
});


bz.create('somekey', 'somevalue', {'gas_price':0.002, 'max_gas': 100000000})
    .then(x => x)
    .then(()=> bz.read('somekey'))
    .then(console.log)
    .catch(console.log);

// (async ()=> {
//     const bz: API = bluzelle(config);
//
//     await bz.create('somekey', 'somevalue', {'gas_price':10});
//     console.log(await bz.read('somekey'));
// })();


// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
