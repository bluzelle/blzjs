//
// Copyright (C) 2020 Bluzelle
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


module.exports =
{
    swarmClient: async (address, mnemonic, endpoint, uuid, chain_id, ...args) =>
    {
        return new Promise(async (resolve, reject) =>
        {
            const api = new API(address, mnemonic, endpoint, uuid, chain_id, ...args);
            api.init().then(function ()
            {
                resolve(api);
            }).catch(function (err)
            {
                reject(err);
            });
        });
    }
};
