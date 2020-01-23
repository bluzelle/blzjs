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


const API = require('./api');

const { pub_from_priv, import_private_key_from_base64, import_public_key_from_base64 } = require('./ecdsa_secp256k1');
const assert = require('assert');


module.exports = {
    swarmClient: async (address, mnemonic, endpoint, uuid, chain_id, ...args) => {

        const api = new API(address, mnemonic, endpoint, uuid, chain_id, ...args);
        await api.init();
        return api;
    },
};


// runs function only once
const once = f => {

    let called = false;

    return (...args) => {

        if(!called) {

            f(...args);
            called = true;

        }        

    }

};  

