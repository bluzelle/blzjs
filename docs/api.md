# API docs

The Bluzelle JavaScript library works with [promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) to model asynchronous behavior. 

Ensure that dependent calls to the Bluzelle database are within `.then()` blocks or within [asynchronous functions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function). Also ensure that promises exceptions are caught and handled.

{% hint style="info" %}
Keys and values in the Bluzelle database are plain strings to ensure compatibility for all forms of serialization. JavaScript applications will want to use `JSON.stringify(obj)` and `JSON.parse(str)` to convert object data to and from string format.
{% endhint %}

## connect\(ws, uuid\)

Configures the address, port, and UUID of the connection. This may be called multiple times, and between other API calls. Bluzelle uses `UUID`'s to identify distinct databases on a single swarm. We recommend using [Version 4 of the universally unique identifier](https://en.wikipedia.org/wiki/Universally_unique_identifier#Version_4_%28random%29).

```javascript
bluzelle.connect('ws://1.2.3.4:51010', '96764e2f-2273-4404-97c0-a05b5e36ea66');
```

{% hint style="info" %}
You must replace the UUID here with your own UUID or else you will have database conflicts.
{% endhint %}

| Argument | Description |
| :--- | :--- |
| ws | The WebSocket entry point to connect to. |
| uuid | The universally unique identifier, Version 4 is recommended. |

Returns `undefined`.

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
| ws | The key to retrieve. |

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
| key | The name of the key to query |
| value | The string value to set the key |

Returns a promise resolving to nothing.

Fails when a response is not received from the connection or invalid value.

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
| value | The string value to set the key |

Returns a promise resolving to nothing.

Fails when a response is not received from the connection or the key is not in the database.

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
| key | The name of the key to d |
| value |  string ve to set the key |

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

