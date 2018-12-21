# Permissioning

## Cryptographic Keys

To use the database, you need to provide your own private key. 

We will provide instructions on how to generate a private key using OpenSSL. OpenSSL comes installed by default on OSX and many linux machines. Otherwise, you will have to install it through your particular package management system.

With OpenSSL installed, you can generate a new key with the following command:

```text
openssl ecparam -name secp256k1 -genkey -noout
```

You will receive an output like this:

```text
-----BEGIN EC PRIVATE KEY-----
MHQCAQEEIOFXRKLsWMIdZpdDdqYUTLKlDRduwvt/aNa4xyN1kZgxoAcGBSuBBAAK
oUQDQgAEYVKSk+CjBEuZy1M9G6d8D6Dbv3J7dYDjtrNumB+enmyJVM0TPHPGNxto
QgIbZ11XAWXnUdtOXJHUOkzSyK7yeQ==
-----END EC PRIVATE KEY-----
```

The string `MHQCAQ...yeQ==` is the private key in an encoding called PEM. It is fed into the `private_pem` field of the [bluzelle constructor](api.md#bluzelle-entry-uuid-private_pem).

{% hint style="info" %}
The private key is synonymous with identity. Multiple users may be emulated with multiple keys. If a private key is made public, the security for that user becomes compromised. 
{% endhint %}

`bluzelle-js` uses your private key to sign off database operations. The decentralized swarm then verifies your signatures to enforce security and permissioning.

Bluzelle uses the Elliptic Curve Digital Signature Algorithm \(**ECDSA**\) on the curve **secp256k1** with an **SHA-512** hash. But you don't need to know worry about this because it's all built-in to the system. 

## Database Permissions

Each database has one owner and any number of writers.

The owner is the user that created the database. \(See the [API page](api.md#createdb)\). Only the owner can add or remove writers. By default, there are no writers. If a user who is not a writer tries to modify a database \(eg. calls `create`, `delete`, or `update`\), they will be rejected with an `ACCESS_DENIED` error.

{% hint style="info" %}
To add a writer, you must provide their public key.
{% endhint %}

In ECDSA cryptography, the public key can be generated from the private key. `bluzelle-js` includes an [API function](api.md#publickey) that returns the public key for the given user.

You may also generate the public key with the OpenSSL command `openssl ec -in private.pem -pubout` where `private.pem` is a file containing the private key.

Databases are always publicly readable. This is by design, because data encryption is not relevant to the aspects of data storage or decentralization; it occurs at the top-most layer of the database hierarchy.

