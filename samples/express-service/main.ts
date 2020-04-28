import {bluzelle} from '../../client/lib/bluzelle-node'
import {BluzelleConfig} from "../../client/lib/BluzelleConfig";
import {memoize} from 'lodash'
import express from 'express'

const PORT = 3000;

const app = express()

const params: BluzelleConfig = {
    address: "bluzelle1htcd86l00dmkptdja75za0akg8mrt2w3qhd65v",
    mnemonic: "apology antique such ancient spend narrow twin banner coral book iron summer west extend toddler walnut left genius exchange globe satisfy shield case rose",
    endpoint: "http://testnet.public.bluzelle.com:1317",
    chain_id: 'bluzelle',
    uuid: Date.now().toString()
}


const getBZ = memoize(() => bluzelle(params));

app.get('/create/:key/:value', (req, res) => {
    getBZ()
        .then(bz => bz.create(req.params.key, req.params.value, {gas_price: '10.0'}))
        .then(() => res.send(`Created ${req.params.key}=${req.params.value}`))
        .catch(e => res.send(e.message))
});

app.get('/read/:key', (req, res) => {
    getBZ()
        .then(bz => bz.read(req.params.key))
        .then(value => res.send(`value = ${value}`))
        .catch(e => res.send(e.message))
})

app.listen(PORT, () => console.log(`listening at http://localhost:${PORT}`))


