# API docs

Read below for detailed documentation on how to use the Bluzelle database.

{% hint style="info" %}
The Bluzelle JavaScript library works with [promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) to model asynchronous behavior. Ensure that dependent calls to the Bluzelle database are within `.then()` blocks or within [asynchronous functions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function). Also ensure that promises exceptions are caught and handled.
{% endhint %}

{% hint style="info" %}
Keys and values in the Bluzelle database are plain strings to ensure compatibility for all forms of serialization. JavaScript applications will probably want to use `JSON.stringify(obj)` and `JSON.parse(str)` to convert object data to and from string format.
{% endhint %}

{% hint style="info" %}
Because Bluzelle is a decentralized database, there are two kinds of asynchronous resolution:

* Commit-style resolution waits until the command has changed the underlying data through a consensus protocol. This is used in `create`, `update`, and `remove`.
* Acknowledgement-style resolution waits until the command has been received by the node, but not for the underlying data to be changed. This is used in `createAck`, `updateAck`, and `removeAck`.
{% endhint %}


## BluzelleClient\(ws, uuid[, verbose]\)



Configures the address, port, and UUID of the connection. This may be called multiple times, and between other API calls. Bluzelle uses `UUID`'s to identify distinct databases on a single swarm. We recommend using [Version 4 of the universally unique identifier](https://en.wikipedia.org/wiki/Universally_unique_identifier#Version_4_%28random%29).

```
const bluzelle = new BluzelleClient(
    'ws://1.2.3.4:51010', 
    '96764e2f-2273-4404-97c0-a05b5e36ea66')
    .then(() => { ... }, error => { ... });
```

{% hint style="info" %}
You must replace the UUID here with your own UUID or else you will have database conflicts.
{% endhint %}

{% hint style="info" %}
`BluzelleClient` is the only export of the Bluzelle library. The calls below are methods of the `BluzelleClient` object.
{% endhint %}


| Argument | Description |
| :--- | :--- |
| ws | The WebSocket entry point to connect to. ex. `ws://testnet.bluzelle.com:51010` |
| uuid | The universally unique identifier, Version 4 is recommended. |
| verbose | When set to `true`, logs the request and response messages for debugging. Defaults to `false`. |


## connect\(\)

Connects to the swarm.


```javascript
// promise syntax
bluzelle.connect()
    .then(() => { ... }, error => { ... });

// async/await syntax
await bluzelle.connect();
```

Returns a promise resolving to nothing.

Fails when the client could not connect.


## disconnect\(\)

Terminates the current connection. This method is synchronous and does not need to be awaited.

```javascript
// promise syntax
bluzelle.disconnect();

```

Returns undefined.



## create\(key, value\)

Create a field in the database.

```javascript
// promise syntax
bluzelle.create('mykey', '{ a: 13 }').then(() => { ... }, error => { ... });

// async/await syntax
await bluzelle.create('mykey', '{ a: 13 }');
```

| Argument | Description |
| :--- | :--- |
| key | The name of the key to create |
| value | The string value to set the key |

Returns a promise resolving to nothing.

Fails when a response is not received from the connection, the key already exists, or invalid value.

## createAck\(key, value\)

Create a field in the database. 

This command does not wait until the change has been committed to the database by the consensus protocol. It resolves once the node has acknowledged receipt of the command. Use this if you want to make sure your message was received, but you do not depend on the underlying data to have been changed yet.

```javascript
// promise syntax
bluzelle.createAck('mykey', '{ a: 13 }').then(() => { ... }, error => { ... });

// async/await syntax
await bluzelle.createAck('mykey', '{ a: 13 }');
```

| Argument | Description |
| :--- | :--- |
| key | The name of the key to create |
| value | The string value to set the key |

Returns a promise resolving to nothing.

Fails when a response is not received.

## read\(key\)

Retrieve the value of a key.

```javascript
// promise syntax
bluzelle.read('mykey').then(value => { ... }, error => { ... });

// async/await syntax
const value = await bluzelle.read('mykey');
```

| Argument | Description |
| :--- | :--- |
| ws | The key to retrieve |

Returns a promise resolving the string value of the key.

Fails when a response is not received or the key does not exist in the database.

## update\(key, value\)

Update a field in the database.

```javascript
// promise syntax
bluzelle.update('mykey', '{ a: 13 }').then(() => { ... }, error => { ... });

// async/await syntax
await bluzelle.update('mykey', '{ a: 13 }');
```

| Argument | Description |
| :--- | :--- |
| key | The name of the key to update |
| value | The string value to set the key |

Returns a promise resolving to nothing.

Fails when a response is not received from the connection, the key does not exist, or invalid value.

## updateAck\(key, value\)

Update a field in the database.

This command does not wait until the change has been committed to the database by the consensus protocol. It resolves once the node has acknowledged receipt of the command. Use this if you want to make sure your message was received, but you do not depend on the underlying data to have been changed yet.

```javascript
// promise syntax
bluzelle.updateAck('mykey', '{ a: 13 }').then(() => { ... }, error => { ... });

// async/await syntax
await bluzelle.updateAck('mykey', '{ a: 13 }');
```

| Argument | Description |
| :--- | :--- |
| key | The name of the key to update |
| value | The string value to set the key |

Returns a promise resolving to nothing.

Fails when a response is not received from the connection.

## remove\(key\)

Deletes a field from the database.

```javascript
// promise syntax
bluzelle.remove('mykey').then(() => { ... }, error => { ... });

// async/await syntax
await bluzelle.remove('mykey');
```

| Argument | Description |
| :--- | :--- |
| key | The name of the key to delete |

Returns a promise resolving to nothing.

Fails when a response is not received from the connection or the key is not in the database.

## removeAck\(key\)

Deletes a field from the database.

This command does not wait until the change has been committed to the database by the consensus protocol. It resolves once the node has acknowledged receipt of the command. Use this if you want to make sure your message was received, but you do not depend on the underlying data to have been changed yet.

```javascript
// promise syntax
bluzelle.removeAck('mykey').then(() => { ... }, error => { ... });

// async/await syntax
await bluzelle.removeAck('mykey');
```

| Argument | Description |
| :--- | :--- |
| key | The name of the key to delete |

Returns a promise resolving to nothing.

Fails when a response is not received.

## has\(key\)

Query to see if a key is in the database.

```javascript
// promise syntax
bluzelle.has('mykey').then(hasMyKey => { ... }, error => { ... });

// async/await syntax
const hasMyKey = await bluzelle.has('mykey');
```

| Argument | Description |
| :--- | :--- |
| key | The name of the key to query |

Returns a promise resolving to a boolean value - `true` or `false`, representing whether the key is in the database.

Fails when a response is not received from the connection.

## keys\(\)

Retrieve a list of all keys.

```javascript
// promise syntax
bluzelle.keys().then(keys => { ... }, error => { ... });

// async/await syntax
const keys = await bluzelle.keys();
```

Returns a promise resolving to an array of strings. ex. `["key1", "key2", ...]`.

Fails when a response is not received from the connection.

## subscribe\(key, observer\)

Subscribe to key changes. Bluzelle supports multiple subscriptions to the same key. Unsubscribing is handled with a unique identifier that is resolved from this call.

It is possible to subscribe to a key that does not exist in the database. Subscribing to a non-existing key is helpful if you want to be notified of its creation.

```javascript
const observer = val => { ... };

// promise syntax
bluzelle.subscribe('mykey', observer).then(id => { ... }, error => { ... });

// async/await syntax
const id = await bluzelle.subscribe('mykey', observer);
```

| Argument | Description |
| :--- | :--- |
| key | The name of the key to subscribe to |
| observer | A single-argument function that will be called whenever the value is written. If the key is deleted from the database, the value is `undefined`. |

Returns a promise resolving to an id number. Pass this to an unsubscribe call \(see below\) to terminate the subscription.

Fails if a response is not received from the connection or there was an error in establishing the subscription.

## unsubscribe\(id\)

Unsubscribe from a key.

```javascript
// promise syntax
bluzelle.unsubscribe(id).then(() => { ... }, error => { ... });

// async/await syntax
await bluzelle.unsubscribe(id);
```

| Argument | Description |
| :--- | :--- |
| id | The subscription id generated by the original subscription call |

Returns a promise resolving to nothing.

Fails if a response is not received from the connection or there was an error in terminating the subscription.

