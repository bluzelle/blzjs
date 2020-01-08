//
// Copyright (C) 2019 Bluzelle
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

const {swarmClient} = require('./swarmClient/main');
//const default_connection = require('../default_connection');

// const Web3 = require('web3');
//
// const abi = require('../BluzelleESR/build/contracts/BluzelleESR.json').abi;


module.exports = {

    bluzelle: async ({log, address, mnemonic, uuid, ...args}) => {

        // Add timestamp to logs
        const timestamp = () => {
            const d = new Date();
            return '[' + d.getMinutes().toString().padStart(2, '0') + ':' + 
                         d.getSeconds().toString().padStart(2, '0') + ':' + 
                         d.getMilliseconds().toString().padEnd(3, '0') + '] ';
        };


        if(log) {   

            // Default log is console.log, but you can pass any other function.
            if(typeof log !== 'function') {
                log = console.log.bind(console);
            }

            const log_ = log;
            log = ((a, ...args) => log_(timestamp() + a, ...args));;

        }

        swarm = await swarmClient(address, mnemonic, (uuid || address));
        if(!swarm) {

            throw new Error('UUID does not exist in the Bluzelle swarm. Contact us at https://gitter.im/bluzelle/Lobby.');

        }

        return swarm;

    },

    version: require('../package.json').version

};


// const promise_const = async (p, v) => {
//     await p;
//     return v;
// };

