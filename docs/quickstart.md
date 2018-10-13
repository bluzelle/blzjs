# Quick Start

## 1. Create an NPM Project

With NodeJS and NPM installed creating a project is a straight forward process:

```
$ mkdir my-bluzelle-project
$ cd my-bluzelle-project
$ npm init
```

## 2. Install the `bluzelle` NPM package

Run `npm install bluzelle` to get the latest and greatest Bluzelle sdk \(see [installation](installation.md) for more details\).

## 3. Run a simple program

Create a file, `my-program.js`, and paste the following starter code.

```javascript
const { BluzelleClient } = require('bluzelle');

const main = async () => {

    const bluzelle = new BluzelleClient(
        'ws://testnet.bluzelle.com:51010',

        // This UUID identifies your database and 
        // may be changed.
        '45498479–2447–47a6–8c36-efa5d251a283'
    );

    await bluzelle.connect();

    await bluzelle.create('myKey', 'myValue');

    console.log(await bluzelle.read('myKey'));

};


main().catch(e => { console.log(e.message); });
```

Run the program with `node my-program`. The expected output is`'myValue'`. Explore the rest of the API on the [API page](api.md).

## Troubleshooting

{% hint style="info" %}
Sometimes running a "hello world" program does not produce expected results. Common problems are listed below.
{% endhint %}

### Your NodeJS installation is out of date

Make sure that your NodeJS installation is modern. Running `node -v` will print your current version. As of the time of writing, the current version is `10.10.0`. Some operating systems ship with outdated versions of node. Follow [this guide](https://www.hostingadvice.com/how-to/update-node-js-latest-version/) to update your installation.

### The testnet is down

While we are consistently improving the system's stability and reliability, sometimes requests cannot be fulfilled due to problems in the distributed network. If you suspect this to be the case, contact us on [Gitter](https://gitter.im/bluzelle/Lobby).

It is possible to launch your own swarm locally using docker by following the instructions [here](https://github.com/bluzelle/docker-swarm-deploy).

### Insecure WebSockets connections over HTTPS

Bluzelle does not currently implement secure WebSockets \(WSS\). If you try to create a connection in an https page, you may get an error message along the lines of "the operation is insecure." To fix, host your page over HTTP, or change your browser settings. In Firefox navigate to "about:config" in the url bar, scroll down and set the `network.websocket.allowInsecureFromHTTPS` flag to true.

