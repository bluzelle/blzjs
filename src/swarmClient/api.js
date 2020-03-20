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


const encode = string => new Uint8Array(Buffer.from(string, 'utf-8'));
const decode = binary => Buffer.from(binary).toString('utf-8');

const def_mnemonic = "";
const app_service = "crud";

function hex2string(hex)
{
    var str = '';
    for (var i = 0; i < hex.length; i += 2)
        str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    return str;
}

function encode_safe(str)
{
    let outstr = '';
    for (var i = 0; i < str.length; i++)
    {
        const ch = str[i];
        switch (ch)
        {
            case '#':
                outstr += '%' + (ch.charCodeAt(0)).toString(16);
                break;

            default:
                outstr += ch;
                break;
        }
    }

    return outstr;
}

module.exports = class API
{

    constructor(address, mnemonic, endpoint, uuid, chain_id/*, ...args*/)
    {
        assert(typeof address === 'string', 'address must be a string');
        assert(typeof mnemonic === 'string', 'mnemonic must be a string');

        this.mnemonic = mnemonic;
        this.address = address;
        this.uuid = uuid;
        this.chain_id = chain_id || "bluzelle";
        this.endpoint = endpoint || "http://localhost:1317";
    }

    init_data()
    {
        const data = {
            BaseReq: {
                from: this.address,
                chain_id: this.chain_id
            },
            UUID: this.uuid,
            Key: key,
            Owner: this.address,
        };

        return data;
    }

    async init()
    {
        return new Promise(async (resolve, reject) =>
        {
            cosmos.init(this.mnemonic, this.endpoint, this.address).then(function()
            {
                resolve();
            }).catch (function(err)
            {
                reject(err);
            });
        });
    }

    status()
    {
        console.log("status");
    }

    // returns a promise resolving to nothing.
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
            cosmos.send_transaction('post', `${app_service}/create`, data, gas_info).then(function (res)
            {
                resolve();
            }).catch(function (err)
            {
                reject(err);
            });
        });
    }

    // returns a promise resolving to nothing.
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
            cosmos.send_transaction('post', `${app_service}/update`, data, gas_info).then(function (res)
            {
                resolve();
            }).catch(function (err)
            {
                reject(err);
            });
        });
    }

    // returns a promise resolving the string value of the key.
    async read(key, prove)
    {
        assert(typeof key === 'string', 'Key must be a string');

        return new Promise(async (resolve, reject) =>
        {
            const uri_key = encode_safe(encodeURI(key));
            const url = prove ? `${app_service}/pread/${this.uuid}/${uri_key}` : `${app_service}/read/${this.uuid}/${uri_key}`;
            cosmos.query(url).then(function (res)
            {
                resolve(res.value);
            }).catch(function (err)
            {
                // treat 404's specially
                if (err.message.substr(0, 3) === '404')
                {
                    reject(new Error("Key not found"));
                }
                else
                {
                    reject(err);
                }
            });
        });
    }

    // returns a promise resolving the string value of the key.
    async txread(key, gas_info)
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
            cosmos.send_transaction('post', `${app_service}/read`, data, gas_info).then(function (res)
            {
                try
                {
                    const str = hex2string(res);
                    const json = JSON.parse(str);
                    resolve(json.value);
                }
                catch(err)
                {
                    resolve(res);
                }
            }).catch(function (err)
            {
                reject(err);
            });
        });
    }

    // returns a promise resolving to nothing.
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
            cosmos.send_transaction('delete', `${app_service}/delete`, data, gas_info).then(function (res)
            {
                resolve();
            }).catch(function (err)
            {
                reject(err);
            });
        });
    }

    // returns a promise resolving to a boolean value - true or false, representing whether the key is in the database.
    async has(key)
    {
        assert(typeof key === 'string', 'Key must be a string');

        return new Promise(async (resolve, reject) =>
        {
            const uri_key = encodeURI(key);
            cosmos.query(`${app_service}/has/${this.uuid}/${uri_key}`).then(function (res)
            {
                resolve(res.has);
            }).catch(function (err)
            {
                reject(err);
            });
        });
    }

    // returns a promise resolving to a boolean value - true or false, representing whether the key is in the database.
    txhas(key, gas_info)
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
            cosmos.send_transaction('post', `${app_service}/has`, data, gas_info).then(function (res)
            {
                try
                {
                    const str = hex2string(res);
                    const json = JSON.parse(str);
                    resolve(json.has);
                }
                catch (err)
                {
                    reject("An error occurred parsing the result");
                }
            }).catch(function (err)
            {
                reject(err);
            });
        });
    }

    // returns a promise resolving to an array of strings. ex. ["key1", "key2", ...]
    async keys()
    {
        return new Promise(async (resolve, reject) =>
        {
            cosmos.query(`${app_service}/keys/${this.uuid}`).then(function (res)
            {
                resolve(res.keys ? res.keys : []);
            }).catch(function (err)
            {
                reject(err);
            });
        });
    }

    // returns a promise resolving to an array of strings. ex. ["key1", "key2", ...]
    txkeys(gas_info)
    {
        const data = {
            BaseReq: {
                from: this.address,
                chain_id: this.chain_id
            },
            UUID: this.uuid,
            Owner: this.address,
        };

        return new Promise(async (resolve, reject) =>
        {
            cosmos.send_transaction('post', `${app_service}/keys`, data, gas_info).then(function (res)
            {
                try
                {
                    const str = hex2string(res);
                    const json = JSON.parse(str);
                    resolve(json.keys ? json.keys : []);
                }
                catch (err)
                {
                    reject("An error occurred parsing the result");
                }
            }).catch(function (err)
            {
                reject(err);
            });
        });
    }

    // returns a promise resolving to nothing
    rename(key, new_key, gas_info)
    {
        assert(typeof key === 'string', 'Key must be a string');
        assert(typeof new_key === 'string', 'New key must be a string');

        const data = {
            BaseReq: {
                from: this.address,
                chain_id: this.chain_id
            },
            UUID: this.uuid,
            Key: key,
            NewKey: new_key,
            Owner: this.address
        };

        return new Promise(async (resolve, reject) =>
        {
            cosmos.send_transaction('post', `${app_service}/rename`, data, gas_info).then(function (res)
            {
                resolve();
            }).catch(function (err)
            {
                reject(err);
            });
        });
    }

    // returns a promise resolving to the number of keys/values
    count()
    {
        return new Promise(async (resolve, reject) =>
        {
            cosmos.query(`/crud/count/${this.uuid}`).then(function (res)
            {
                resolve(parseInt(res.count));
            }).catch(function (err)
            {
                reject(err);
            });
        });
    }

    // returns a promise resolving to the number of keys/values
    txcount(gas_info)
    {
        const data = {
            BaseReq: {
                from: this.address,
                chain_id: this.chain_id
            },
            UUID: this.uuid,
            Owner: this.address,
        };

        return new Promise(async (resolve, reject) =>
        {
            cosmos.send_transaction('post', `${app_service}/count`, data, gas_info).then(function (res)
            {
                try
                {
                    const str = hex2string(res);
                    const json = JSON.parse(str);
                    resolve(parseInt(json.count));
                }
                catch (err)
                {
                    reject("An error occurred parsing the result");
                }
            }).catch(function (err)
            {
                reject(err);
            });
        });
    }

    // returns a promise resolving to nothing
    deleteall(gas_info)
    {
        const data = {
            BaseReq: {
                from: this.address,
                chain_id: this.chain_id
            },
            UUID: this.uuid,
            Owner: this.address,
        };

        return new Promise(async (resolve, reject) =>
        {
            cosmos.send_transaction('post', `${app_service}/deleteall`, data, gas_info).then(function (res)
            {
                resolve();
            }).catch(function (err)
            {
                reject(err);
            });
        });
    }

    // returns a promise resolving to a JSON array containing keys and values
    keyvalues()
    {
        return new Promise(async (resolve, reject) =>
        {
            cosmos.query(`/crud/keyvalues/${this.uuid}`).then(function (res)
            {
                resolve(res.keyvalues);
            }).catch(function (err)
            {
                reject(err);
            });
        });
    }

    // returns a promise resolving to a JSON array containing keys and values
    txkeyvalues(gas_info)
    {
        const data = {
            BaseReq: {
                from: this.address,
                chain_id: this.chain_id
            },
            UUID: this.uuid,
            Owner: this.address,
        };

        return new Promise(async (resolve, reject) =>
        {
            cosmos.send_transaction('post', `${app_service}/keyvalues`, data, gas_info).then(function (res)
            {
                try
                {
                    const str = hex2string(res);
                    const json = JSON.parse(str);
                    resolve(json.keyvalues);
                }
                catch (err)
                {
                    reject("An error occurred parsing the result");
                }
            }).catch(function (err)
            {
                reject(err);
            });
        });
    }

    // returns a promise resolving to a JSON object representing the user account data.
    async account()
    {
        return new Promise(async (resolve, reject) =>
        {
            cosmos.query(`/auth/accounts/${this.address}`).then(function (res)
            {
                resolve(res.value);
            }).catch(function (err)
            {
                reject(err);
            });
        });
    }

    // returns a promise resolving to a version string.
    async version()
    {
        return new Promise(async (resolve, reject) =>
        {
            cosmos.query(`/crud/version`).then(function (res)
            {
                resolve(res.version);
            }).catch(function (err)
            {
                reject(err);
            });
        });
    }
};
