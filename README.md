[![Build Status](https://travis-ci.org/bluzelle/blzjs.svg?branch=devel)](https://travis-ci.org/bluzelle/blzjs) [![Coverage Status](https://coveralls.io/repos/github/bluzelle/blzjs/badge.svg)](https://coveralls.io/github/bluzelle/blzjs)
<a href="https://bluzelle.com/"><img src='https://raw.githubusercontent.com/bluzelle/api/master/source/images/Bluzelle%20-%20Logo%20-%20Big%20-%20Colour.png' alt="Bluzelle" style="width: 100%"/></a>

**blzjs** is a Typescript/JavaScript library that can be used to access the Bluzelle database service.

# Installation



```
yarn add bluzelle
or
npm install bluzelle
```
```
import { bluzelle } from 'bluzelle';
or
const { bluzelle } = require('bluzelle');
```


* [API docs](https://github.com/bluzelle/blzjs/tree/devel/client)
* [Download browser version for `<script>` tag](https://github.com/bluzelle/blzjs/tree/devel/browser-client)
* [Examples](https://github.com/bluzelle/blzjs/tree/devel/samples)
* [REPL (interactive console)](https://github.com/bluzelle/blzjs/tree/devel/repl)

# Quckstart

### Javascript
```javascript
const {bluzelle} = require('bluzelle');

const config = {
    mnemonic: "apology antique such ancient spend narrow twin banner coral book iron summer west extend toddler walnut left genius exchange globe satisfy shield case rose",
    endpoint: "http://testnet.public.bluzelle.com:1317",
    chain_id: 'bluzelle',
    uuid: Date.now().toString()
};

(async () => {
    const bz = await bluzelle(config);

    await bz.create("somekey", "somevalue", {'gas_price': 10})
    console.log(await bz.read("somekey"))
})();

```

### Typescript

```typescript
import {bluzelle, API, BluzelleConfig} from 'bluzelle';

const config: BluzelleConfig = {
    mnemonic: "apology antique such ancient spend narrow twin banner coral book iron summer west extend toddler walnut left genius exchange globe satisfy shield case rose",
    endpoint: "http://testnet.public.bluzelle.com:1317",
    chain_id: 'bluzelle',
    uuid: Date.now().toString()
};

(async () => {
    const bz: API = await bluzelle(config);

    await bz.create("somekey", "somevalue", {'gas_price': 10})
    console.log(await bz.read("somekey"))
})();

```