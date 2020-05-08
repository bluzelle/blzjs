[![Build Status](https://travis-ci.org/bluzelle/blzjs.svg?branch=devel)](https://travis-ci.org/bluzelle/blzjs) [![Coverage Status](https://coveralls.io/repos/github/bluzelle/blzjs/badge.svg)](https://coveralls.io/github/bluzelle/blzjs)
<a href="https://bluzelle.com/"><img src='https://raw.githubusercontent.com/bluzelle/api/master/source/images/Bluzelle%20-%20Logo%20-%20Big%20-%20Colour.png' alt="Bluzelle" style="width: 100%"/></a>

**blzjs** is a JavaScript library that can be used to access the Bluzelle database service.

# blzjs Installation



```
yarn add bluzelle
or
npm install bluzelle
```
```
import { bluzele } from 'bluzelle';
or
const { bluzelle } = require('bluzelle');
```

# Getting Started

The *examples* directory contains various examples for pure NodeJS express and single-page applications.

To start a connection simply call *bluzelle* with your configuration.
```
const api = await bluzelle({
        mnemonic: swarm_mnemonic,
        endpoint: swarm_endpoint,
        chain_id: swarm_chain_id
        uuid:     my_uuid,
    });

```

# blzjs API documentation

![#1589F0](https://placehold.it/15/1589F0/000000?text=+) Keys and values in the Bluzelle database are plain strings. To store an object serialize your objects to a string using JSON or some other serializer.

![#1589F0](https://placehold.it/15/1589F0/000000?text=+) Some API functions take *gas_info* as a parameter. This is a object literal containing parameters related to gas consumption as follows:

```javascript
{
    gas_price: 10, // maximum price to pay for gas (integer, in ubnt)
    max_gas: 20000,    // maximum amount of gas to consume for this call (integer)
    max_fee: 20000 // maximum amount to charge for this call (integer, in ubnt)
};
````
All values are optional. The `max_gas` value will always be honored if present, otherwise a default value will be used. If both `max_fee` and `gas_price` are specified, `gas_price` will be ignored and calculated based on the provided `max_fee`.

![#1589F0](https://placehold.it/15/1589F0/000000?text=+) Some API functions take ***lease_info*** as a parameter. This is a JavaScript object containing parameters related to the minimum time a key should be maintained in the database, as follows:
```javascript
{
    'days':    0, // number of days (integer)
    'hours':   0, // number of hours (integer)
    'minutes': 0  // number of minutes (integer)
    'seconds': 0  // number of seconds (integer)
};
````
All values are optional. If none are provided a default value of 10 days will be used.


![#1589F0](https://placehold.it/15/1589F0/000000?text=+) The example code in the `examples` directory require Node.js in order to run. For instructions on how to install Node.js for your platform, please see http://nodejs.org

## Exports

### bluzelle\({...}\)

Configures the Bluzelle connection. This may be called multiple times to create multiple clients.

#### Plain Javascript

```javascript
const {bluzelle} = require('bluzelle');

const api = await bluzelle({
    mnemonic: 'volcano arrest ceiling physical concert sunset absent hungry tobacco canal census era pretty car code crunch inside behind afraid express giraffe reflect stadium luxury',
    endpoint: "http://localhost:1317",
    uuid:     "20fc19d4-7c9d-4b5c-9578-8cedd756e0ea",
    chain_id: "bluzelle"
});
```

#### Typescript

```typescript
import {bluzelle, API} from 'bluzelle';


const api: API = await bluzelle({
    mnemonic: 'volcano arrest ceiling physical concert sunset absent hungry tobacco canal census era pretty car code crunch inside behind afraid express giraffe reflect stadium luxury',
    endpoint: "http://localhost:1317",
    uuid:     "20fc19d4-7c9d-4b5c-9578-8cedd756e0ea",
    chain_id: "bluzelle"
});
```


| Argument | Description |
| :--- | :--- |
| **mnemonic** | The mnemonic of the private key for your Bluzelle account |
| endpoint | \(Optional\) The hostname and port of your rest server. Default: http://localhost:1317 |
| uuid | Bluzelle uses `UUID`'s to identify distinct databases on a single swarm. We recommend using [Version 4 of the universally unique identifier](https://en.wikipedia.org/wiki/Universally_unique_identifier#Version_4_%28random%29).  |
| chain_id | \(Optional\) The chain id of your Bluzelle account. Default: bluzelle |


## General Functions

### version\()

Retrieve the version of the Bluzelle service.

```javascript
// promise syntax
api.version()
	.then((version) => { ... })
	.catch(error => { ... });

// async/await syntax
const version = await api.version();
```

Returns: Promise=>string


### account\()

Retrieve information about the currently active Bluzelle account.

```javascript
// promise syntax
api.account()
	.then((info) => { ... })
	.catch((error) => { ... });

// async/await syntax
const info = await api.account();
```
Returns: Promise=>object

```
{ address: 'bluzelle1lgpau85z0hueyz6rraqqnskzmcz4zuzkfeqls7',
  coins: [ { denom: 'bnt', amount: '9899567400' } ],
  public_key: 'bluzellepub1addwnpepqd63w08dcrleyukxs4kq0n7ngalgyjdnu7jpf5khjmpykskyph2vypv6wms',
  account_number: 3,
  sequence: 218 }
```

## Database Functions

**NOTE: When a function has a 'tx' and non-'tx' version, the 'tx' version uses consensus.**

### create\(key, value, gas_info [, lease_info]\)

Create a field in the database.

```javascript
// promise syntax
api.create('mykey', 'myValue', {gas_price: 10}, {days: 100})
	.then(() => { ... })
	.catch(error => { ... });

// async/await syntax
await api.create('mykey', 'myValue', {gas_price: 10}, {days: 100});
```

| Argument | Description |
| :--- | :--- |
| key | The name of the key to create |
| value | The string value |
| gas_info | Object containing gas parameters (see above) |
| lease_info (optional) | Minimum time for key to remain in database (see above) |

Returns: Promise=>void

### read\(key, [prove]\)

Retrieve the value of a key without consensus verification. Can optionally require the result to have a cryptographic proof (slower).

```javascript
// promise syntax
api.read('mykey')
	.then(value => { ... })
	.catch(error => { ... });

// async/await syntax
const value = await api.read('mykey');
```

| Argument | Description |
| :--- | :--- |
| key | The key to retrieve |
| prove | A proof of the value is required from the network (requires 'config trust-node false' to be set) |

Returns: Promise=>string (the value)

### txRead\(key, gas_info\)

Retrieve the value of a key with consensus.

```javascript
// promise syntax
api.txRead('mykey', {gas_price: 10})
	.then(value => { ... })
	.catch(error => { ... });

// async/await syntax
const value = await api.txRead('mykey', {gas_price: 10});
```

| Argument | Description |
| :--- | :--- |
| key | The key to retrieve |
| gas_info | Object containing gas parameters (see above) |

Returns: Promise=>value

### update\(key, value, gas_info [, lease_info]\)

Update a field in the database.

```javascript
// promise syntax
api.update('mykey', '{ a: 13 }', {gas_price: 10}, {days: 100})
	.then(() => { ... })
	.catch(error => { ... });

// async/await syntax
await api.update('mykey', '{ a: 13 }, {gas_price: 10}', {days: 100});
```

| Argument | Description |
| :--- | :--- |
| key | The name of the key to create |
| value | The string value to set the key |
| gas_info | Object containing gas parameters (see above) |
| lease_info (optional) | Positive or negative amount of time to alter the lease by. If not specified, the existing lease will not be changed. |

Returns: Promise=>void

### delete\(key, gas_info\)

Delete a key from the database.

```javascript
// promise syntax
api.delete('mykey', {gas_price: 10})
	.then(() => { ... })
	.catch(error => { ... });

// async/await syntax
await bluzelle.delete('mykey', {gas_price: 10});
```

| Argument | Description |
| :--- | :--- |
| key | The name of the key to delete |
| gas_info | Object containing gas parameters (see above) |

Returns: Promise=>void

### has\(key\)

Query to see if a key is in the database. This function bypasses the consensus and cryptography mechanisms in favor of speed.


```javascript
// promise syntax
api.has('mykey')
	.then(hasMyKey => { ... })
	.catch(error => { ... });

// async/await syntax
const hasMyKey = await api.has('mykey');
```

| Argument | Description |
| :--- | :--- |
| key | The name of the key to query |

Returns: Promise=>boolean

### txHas\(key, gas_info\)

Query to see if a key is in the database via a transaction (i.e. uses consensus).

```javascript
// promise syntax
api.txHas('mykey', {gas_price: 10})
	.then(hasMyKey => { ... })
	.catch(error => { ... });

// async/await syntax
const hasMyKey = await api.txHas('mykey', {gas_price: 10});
```

| Argument | Description |
| :--- | :--- |
| key | The name of the key to query |
| gas_info | Object containing gas parameters (see above) |

Returns: Promise=>boolean

### keys\(\)

Retrieve a list of all keys. This function bypasses the consensus and cryptography mechanisms in favor of speed.

```javascript
// promise syntax
api.keys()
	.then(keys => { ... }
	.catch(error => { ... });

// async/await syntax
const keys = await api.keys();
```

Returns: Promise=>array (array of keys)

### txKeys\(gas_info\)

Retrieve a list of all keys via a transaction (i.e. uses consensus).

```javascript
// promise syntax
api.txKeys({gas_price: 10})
	.then(keys => { ... })
	.catch(error => { ... });

// async/await syntax
const keys = await api.txKeys({gas_price: 10});
```

| Argument | Description |
| :--- | :--- |
| gas_info | Object containing gas parameters (see above) |

Returns: Promise=>array (array of keys)

### rename\(key, new_key, gas_info\)

Change the name of an existing key.

```javascript
// promise syntax
api.rename("key", "newkey", {gas_price: 10})
	.then(() => { ... })
	.catch(error => { ... });

// async/await syntax
await api.rename("key", "newkey", {gas_price: 10});
```

| Argument | Description |
| :--- | :--- |
| key | The name of the key to rename |
| new_key | The new name for the key |
| gas_info | Object containing gas parameters (see above) |

Returns: Promise=>void

### count\(\)

Retrieve the number of keys in the current database/uuid. This function bypasses the consensus and cryptography mechanisms in favor of speed.

```javascript
// promise syntax
api.count()
	.then(number => { ... })
	.catch(error => { ... });

// async/await syntax
const number = await api.count();
```

Returns: Promise=>number

### txCount\(gas_info\)

Retrieve the number of keys in the current database/uuid via a transaction.

```javascript
// promise syntax
api.txCount({gas_price: 10})
	.then(number => { ... })
	.catch(error => { ... });

// async/await syntax
const number = await api.txCount({gas_price: 10});
```

| Argument | Description |
| :--- | :--- |
| gas_info | Object containing gas parameters (see above) |

Returns: Promise=>number

### deleteAll\(gas_info\)

Remove all keys in the current database/uuid.

```javascript
// promise syntax
api.deleteAll({gas_price: 10})
	.then(() => { ... })
	.catch(error => { ... });

// async/await syntax
await api.deleteAll({gas_price: 10});
```

| Argument | Description |
| :--- | :--- |
| gas_info | Object containing gas parameters (see above) |

Returns: Promise=>void

### keyValues\(\)

Returns all keys and values in the current database/uuid. This function bypasses the consensus and cryptography mechanisms in favor of speed.

```javascript
// promise syntax
api.keyValues()
	.then(kvs => { ... })
	.catch(error => { ... });

// async/await syntax
const kvs = await api.keyValues();
```

Returns: Promise=>object

```
[{"key": "key1", "value": "value1"}, {"key": "key2", "value": "value2"}]
```

### txKeyValues\(gas_info\)

Returns all keys and values in the current database/uuid via a transaction.

```javascript
// promise syntax
api.txKeyValues({gas_price: 10})
	.then(kvs => { ... })
	.catch(error => { ... });

// async/await syntax
const kvs = await api.txKeyValues({gas_price: 10});
```

| Argument | Description |
| :--- | :--- |
| gas_info | Object containing gas parameters (see above) |

Returns: Promise=>object

```
[{"key": "key1", "value": "value1"}, {"key": "key2", "value": "value2"}]
```

### multiUpdate\(key_values, gas_info\)

Update multiple fields in the database.

```javascript
// promise syntax
api.multiUpdate([{key: "key1", value: "value1"}, {key: "key2", value: "value2"}], {gas_price: 10})
	.then(() => { ... })
	.catch(error => { ... });

// async/await syntax
await api.multiUpdate([{key: "key1", value: "value1"}, {key: "key2", value: "value2"}, {gas_price: 10}');
```

| Argument | Description |
| :--- | :--- |
| key_values | An array of objects containing keys and values (see example avove) |
| gas_info | Object containing gas parameters (see above) |

Returns: Promise=>void

### getLease\(key\)

Retrieve the minimum time remaining on the lease for a key. This function bypasses the consensus and cryptography mechanisms in favor of speed.

```javascript
// promise syntax
api.getLease('mykey')
	.then(value => { ... })
	.catch(error => { ... });

// async/await syntax
const value = await api.getLease('mykey');
```

| Argument | Description |
| :--- | :--- |
| key | The key to retrieve the lease information for |

Returns: Promise=>number (the minimum length of time remaining for the key's lease, in seconds)

### txGetLease\(key, gas_info\)

Retrieve the minimum time remaining on the lease for a key, using a transaction.

```javascript
// promise syntax
api.txGetLease('mykey', {gas_price: 10})
	.then(value => { ... })
	.catch(error => { ... });

// async/await syntax
const value = await api.txGetLease('mykey', {gas_price: 10});
```

| Argument | Description |
| :--- | :--- |
| key | The key to retrieve the lease information for |
| gas_info | Object containing gas parameters (see above) |

Returns: Promise=>number (minimum length of time remaining for the key's lease, in seconds)

### renewLease\(key, gas_info[, lease_info]\)

Update the minimum time remaining on the lease for a key.

```javascript
// promise syntax
api.renewLease('mykey', {gas_price: 10}, {days: 100})
	.then(value => { ... })
	.catch(error => { ... });

// async/await syntax
const value = await api.renewLease('mykey', {gas_price: 10}, {days: 100});
```

| Argument | Description |
| :--- | :--- |
| key | The key to retrieve the lease information for |
| gas_info | Object containing gas parameters (see above) |
| lease_info (optional) | Minimum time for key to remain in database (see above) |

Returns: Promise=>number (minimum length of time remaining for the key's lease)

### renewLeaseAll\(gas_info[, lease_info]\)

Update the minimum time remaining on the lease for all keys.

```javascript
// promise syntax
api.renewLease('mykey', {gas_price: 10}, {days: 100})
.then(value => { ... })
.catch(error => { ... });

// async/await syntax
const value = await api.renewLease('mykey', {gas_price: 10}, {days: 100});
```

| Argument | Description |
| :--- | :--- |
| gas_info | Object containing gas parameters (see above) |
| lease_info (optional) | Minimum time for key to remain in database (see above) |

Returns: Promise=>number (minimum length of time remaining for the key's lease)

### getNShortestLeases\(n\)

Retrieve a list of the n keys in the database with the shortest leases.  This function bypasses the consensus and cryptography mechanisms in favor of speed.

```javascript
// promise syntax
api.getNShortestLeases(10)
	.then(keys => { ... })
	.catch(error => { ... });

// async/await syntax
const keys = await api.getNShortestLeases(10);
```

| Argument | Description |
| :--- | :--- |
| n | The number of keys to retrieve the lease information for |

Returns: Promise=>object (containing key, lease (in seconds))
```
[ { key: "mykey", lease: { seconds: "12345" } }, {...}, ...]
```

### txGetNShortestLeases\(n, gas_info\)

Retrieve a list of the N keys/values in the database with the shortest leases, using a transaction.

```javascript
// promise syntax
api.txGetNShortestLeases(10)
	.then(keys => { ... })
	.catch(error => { ... });

// async/await syntax
const keys = await api.txGetNShortestLeases(10);
```

| Argument | Description |
| :--- | :--- |
| n | The number of keys to retrieve the lease information for |
| gas_info | Object containing gas parameters (see above) |

Returns: Promise=>array (of objects containing key, lifetime (in seconds))

```
[ { key: "mykey", lifetime: "12345" }, {...}, ...]
```
