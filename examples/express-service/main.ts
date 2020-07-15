import {bluzelle, API} from 'bluzelle'
import express from 'express'
import {bluzelleConfig} from "../example-config";

const PORT = 3000;

const app = express()

const bz: API = bluzelle(bluzelleConfig);

app.get('/create/:key/:value', (req, res) => {
        bz.create(req.params.key, req.params.value, {gas_price: 10})
        .then(() => res.send(`Created ${req.params.key}=${req.params.value}`))
        .catch(e => res.send(e.message))
});

app.get('/read/:key', (req, res) => {
        bz.read(req.params.key)
        .then(value => res.send(`value = ${value}`))
        .catch(e => res.send(e.message))
})

app.listen(PORT, () => console.log(`listening at http://localhost:${PORT}`))


