#!/usr/bin/node

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

const { bluzelle } = require('bluzelle');

const gas_params = {'gas_price': '0.01'};
var bz;

const main = async () => {

    bz = await bluzelle({
        address: 'cosmos1zuxcvpkxlzf37dh4k95e2rujmy9sxqvxhaj5pn',
        mnemonic: 'desert maple evoke popular trumpet beach primary decline visit enhance dish drink excite setup public forward ladder girl end genre symbol alter category choose',
        endpoint: "http://localhost:1317",
        chain_id: "bluzelle"
    });

    try
    {
        switch (process.argv[2])
        {
            case 'create':
                res = await bz.create(process.argv[3], process.argv[4], gas_params);
                break;
            case 'read':
                res = await bz.read(process.argv[3], gas_params);
                break;
            case 'update':
                res = await bz.update(process.argv[3], process.argv[4], gas_params);
                break;
            case 'delete':
                res = await bz.delete(process.argv[3], gas_params);
                break;
            case 'has':
                res = await bz.has(process.argv[3], gas_params);
                break;
            case 'keys':
                res = await bz.keys(gas_params);
                break;
        }

        console.log(res);
    }
    catch(e)
    {
        console.error(e.message);
    }
};


main();
