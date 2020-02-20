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


const assert = require('assert');
const cosmos = require('./cosmos');

const encode = string => new Uint8Array(Buffer.from(string, 'utf-8'));
const decode = binary => Buffer.from(binary).toString('utf-8');

const def_mnemonic = "";

function hex2string(hex)
{
    var str = '';
    for (var i = 0; i < hex.length; i += 2)
        str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    return str;
}

module.exports = class API
{

    constructor(address, mnemonic, endpoint, uuid, chain_id/*, ...args*/)
    {
        this.mnemonic = mnemonic || def_mnemonic;
        this.address = address;
        this.uuid = uuid;
        this.chain_id = chain_id || "bluzelle";
        this.endpoint = endpoint;
    }

    async init()
    {
        return await cosmos.init(this.mnemonic, this.endpoint);
    }

    status()
    {
        console.log("status");
    }

    async create(key, value, gas_info)
    {
        assert(typeof key === 'string', 'Key must be a string');
        assert(typeof value === 'string', 'Value must be a string');

        const data = {
            BaseReq: {
                from: this.address,
                chain_id: this.chain_id
            },
            UUID: this.uuid,
            Key: key,
            Value: value,
            Owner: this.address,
        };

        return new Promise(async (resolve, reject) =>
        {
            cosmos.send_transaction('post', 'creat', data, gas_info).then(function (res)
            {
                resolve({Result: res.data.logs[0].success});
            }).catch(function (err)
            {
                reject(err);
            });
        });
    }


    async update(key, value, gas_info)
    {
        assert(typeof key === 'string', 'Key must be a string');
        assert(typeof value === 'string', 'Value must be a string');

        const data = {
            BaseReq: {
                from: this.address,
                chain_id: this.chain_id
            },
            UUID: this.uuid,
            Key: key,
            Value: value,
            Owner: this.address,
        };

        return new Promise(async (resolve, reject) =>
        {
            cosmos.send_transaction('post', 'update', data, gas_info).then(function (res)
            {
                resolve({Result: res.data.logs[0].success});
            }).catch(function (err)
            {
                reject(err);
            });
        });
    }

    async quickread(key, prove)
    {
        assert(typeof key === 'string', 'Key must be a string');

        return new Promise(async (resolve, reject) =>
        {
            const url = prove ? `pread/${this.uuid}/${key}` : `read/${this.uuid}/${key}`;
            cosmos.query(url).then(function (res)
            {
                resolve(res);
            }).catch(function (err)
            {
                if (err.Error.substr(0, 3) === '404')
                {
                    reject({Error: "Key not found"});
                }
                else
                {
                    prove ? reject(err) : reject({Error: err});
                }
            });
        });
    }

    async read(key, gas_info)
    {
        assert(typeof key === 'string', 'Key must be a string');

        const uuid = this.uuid;
        const data = {
            BaseReq: {
                from: this.address,
                chain_id: this.chain_id
            },
            UUID: uuid,
            Key: key,
            Owner: this.address,
        };

        return new Promise(async (resolve, reject) =>
        {
            cosmos.send_transaction('post', 'read', data, gas_info).then(function (res)
            {
                resolve({
                    UUID: uuid,
                    Key: key,
                    Value: hex2string(res.data.data)
                });

            }).catch(function (err)
            {
                reject(err);
            });
        });
    }

    async delete(key, gas_info)
    {
        assert(typeof key === 'string', 'Key must be a string');

        const data = {
            BaseReq: {
                from: this.address,
                chain_id: this.chain_id
            },
            UUID: this.uuid,
            Key: key,
            Owner: this.address,
        };

        return new Promise(async (resolve, reject) =>
        {
            cosmos.send_transaction('delete', 'delete', data, gas_info).then(function (res)
            {
                resolve({Result: res.data.logs[0].success});
            }).catch(function (err)
            {
                reject(err);
            });
        });
    }

    async quickhas(key)
    {
        assert(typeof key === 'string', 'Key must be a string');
        return cosmos.query(`has/${this.uuid}/${key}`);
    }


    has(key, gas_info)
    {
        assert(typeof key === 'string', 'Key must be a string');

        const uuid = this.uuid;
        const data = {
            BaseReq: {
                from: this.address,
                chain_id: this.chain_id
            },
            UUID: uuid,
            Key: key,
            Owner: this.address,
        };

        return new Promise(async (resolve, reject) =>
        {
            cosmos.send_transaction('post', 'has', data, gas_info).then(function (res)
            {
                resolve({
                    UUID: uuid,
                    Key: key,
                    Value: hex2string(res.data.data)
                });

            }).catch(function (err)
            {
                reject(err);
            });
        });
    }


    async quickkeys()
    {
        return cosmos.query(`keys/${this.uuid}`);
    }


    keys(gas_info)
    {
        const uuid = this.uuid;
        const data = {
            BaseReq: {
                from: this.address,
                chain_id: this.chain_id
            },
            UUID: uuid,
            Owner: this.address,
        };

        return new Promise(async (resolve, reject) =>
        {
            cosmos.send_transaction('post', 'keys', data, gas_info).then(function (res)
            {
                resolve({
                    UUID: uuid,
                    Value: hex2string(res.data.data)
                });

            }).catch(function (err)
            {
                reject(err);
            });
        });
    }

};
