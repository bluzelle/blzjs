---
description: Start using bluzelle in under five minutes by following this JavaScript guide.
---

# Quick Start

## 1. Create an NPM Project

With NodeJS and NPM installed creating a project is a straight forward process:

```
$ mkdir my-bluzelle-project
$ cd my-bluzelle-project
$ npm init
```

## 2. Install the `bluzelle` NPM package

Run `npm install bluzelle` to get the latest and greatest Bluzelle sdk.

## 3. Run a simple program

Create a file, `my-program.js`, and paste the following starter code.

```javascript
const bluzelle = require('bluzelle');

bluzelle.connect('ws://testnet.bluzelle.com:51010',
'45498479–2447–47a6–8c36-efa5d251a283'); // This UUID identifies your database

bluzelle.create('myKey', 'myValue').then(() =>
{
     bluzelle.read('myKey').then(value =>
     {
     
          console.log(value); // 'myValue'
          
     }).catch(e => console.log(e.message));
     
}).catch(e => console.log(e.message));
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

