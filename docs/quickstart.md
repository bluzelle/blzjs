# Quick Start

{% hint style="info" %}
Bluzelle offers two networks: a mainnet and a testnet. The testnet provides more liberal permissioning policies and may be used out-of-box.

Currently, only the Bluzelle testnet is available.
{% endhint %}

## 0. Get your Bluzelle key pair

### Testnet

1. Generate an ECDSA key pair on the curve secp256k1. Choose one of the following options: 
   1. With openssl installed, run   `openssl ecparam -name secp256k1 -genkey -noout -out priv_key.pem; openssl ec -in priv_key.pem -pubout -out pub_key.pem`   This will generate two files called `priv_key.pem` and `pub_key.pem`. 
   2. Visit [https://keytool.online/](https://keytool.online/). Switch the tab to "ECDSA" and select "P-256k" for the curve. Copy the public/private keys and save them into plain text files called `pub_key.pem` and `priv_key.pem` respectively. 
2. With your key pair generated, visit [http://studio.bluzelle.com/](http://studio.bluzelle.com/) and upload both files. Hit the "go" button to create your database. You may use this interface to manually change or inspect your database contents.

### Mainnet

Please contact us to inquire about mainnet availability.

{% embed url="https://gitter.im/bluzelle/Lobby" caption="" %}

## 1. Create an NPM Project

With NodeJS and NPM installed creating a project is a straight forward process:

```text
$ mkdir my-bluzelle-project
$ cd my-bluzelle-project
$ npm init
```

## 2. Install the `bluzelle` NPM package

Run `npm install bluzelle` to get the latest and greatest Bluzelle sdk \(see [installation](details/installation.md) for more details\).

## 3. Run a simple program

Create a file, `my-program.js`, and paste the following starter code. \(Click the copy button in the top-right corner of the code window to preserve line endings\)

Replace `public_pem` and `private_pem` with your personal key pair.

Run the program with `node my-program`. The expected output is `The value of myKey is: myValue`. If you run the program multiple times, it will fail with `KEY_EXISTS` .

Explore the rest of the API on the [API page](api.md).

```javascript
const { bluzelle } = require('bluzelle');

let bz;

const main = async () => {

    bz = await bluzelle({
        public_pem: 'MFYwEAYHKoZIzj0CAQYFK4EEAAoDQgAE9bpzn2nMBJUndlgsbDH5II5zboGWq3DCfv0alLYUdPBqYIy0atSU5QuckupktqPebw28y/ZZ38k0MVfCQrYE5g==',
        private_pem: 'MHQCAQEEIBWT/Vz7ZAxqkaBxXhjKEXfteiERFMNf2QqM7PxuXDOwoAcGBSuBBAAKoUQDQgAE9bpzn2nMBJUndlgsbDH5II5zboGWq3DCfv0alLYUdPBqYIy0atSU5QuckupktqPebw28y/ZZ38k0MVfCQrYE5g=='
    });

    await bz.create('myKey', 'myValue');

    console.log('The value of myKey is: ', await bz.read('myKey'));

};


main()
    .catch(e => console.error(e.message))
    .finally(() => bz && bz.close());
```

## Troubleshooting

{% hint style="info" %}
Sometimes running a "hello world" program does not produce expected results. Common problems are listed below.
{% endhint %}

### UUID does not exist in the Bluzelle swarm...

You have to contact us to receive your unique key pair and replace the `private_pem` and `public_pem` in the code sample given.

### Your NodeJS installation is out of date

Make sure that your NodeJS installation is modern. Running `node -v` will print your current version. As of the time of writing, the current version is `11.4.0`. Some operating systems ship with outdated versions of node. Follow [this guide](https://www.hostingadvice.com/how-to/update-node-js-latest-version/) to update your installation.

### The testnet is down

While we are consistently improving the system's stability and reliability, sometimes requests cannot be fulfilled due to problems in the distributed network. If you suspect this to be the case, contact us on [Gitter](https://gitter.im/bluzelle/Lobby).

It is possible to launch your own swarm locally using docker by following the instructions [here](https://github.com/bluzelle/docker-swarm-deploy).

### Insecure WebSockets connections over HTTPS

Bluzelle does not currently implement secure WebSockets \(WSS\). If you try to create a connection in an https page, you may get an error message along the lines of "the operation is insecure." To fix, host your page over HTTP, or change your browser settings. In Firefox navigate to "about:config" in the url bar, scroll down and set the `network.websocket.allowInsecureFromHTTPS` flag to true.

