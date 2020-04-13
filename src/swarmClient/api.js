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
cosmos = require('./cosmos');

const encode = string => new Uint8Array(Buffer.from(string, 'utf-8'));
const decode = binary => Buffer.from(binary).toString('utf-8');

const def_mnemonic = "";
const app_service = "crud";
const BLOCK_TIME_IN_SECONDS = 5;

function hex2string(hex)
{
    var str = '';
    for (var i = 0; i < hex.length; i += 2)
        str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    return str;
}

function parse_result(str, reject)
{
    try
    {
        const json = hex2string(str);
        return JSON.parse(json);
    }
    catch (err)
    {
        reject(new Error("An error occurred parsing the result"));
    }
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
    async create(key, value, gas_info, lease_info)
    {
        assert(typeof key === 'string', 'Key must be a string');
        assert(typeof value === 'string', 'Value must be a string');

        const blocks = this.convert_lease(lease_info);
        if (blocks < 0)
        {
            throw new Error("Invalid lease time");
        }

        return this.do_tx({
            Key: key,
            Value: value,
            Lease: blocks
        }, 'post', 'create', gas_info, function(res, resolve, reject)
        {
            resolve();
        });
    }

    // returns a promise resolving to nothing.
    async update(key, value, gas_info, lease_info)
    {
        assert(typeof key === 'string', 'Key must be a string');
        assert(typeof value === 'string', 'Value must be a string');

        return this.do_tx({
            Key: key,
            Value: value,
            Lease: this.convert_lease(lease_info)
        }, 'post', 'update', gas_info, function(res, resolve, reject)
        {
            resolve();
        });
    }

    // returns a promise resolving the string value of the key.
    async read(key, prove)
    {
        assert(typeof key === 'string', 'Key must be a string');

        return new Promise(async (resolve, reject) =>
        {
            const uri_key = this.encode_safe(key);
            const url = prove ? `${app_service}/pread/${this.uuid}/${uri_key}` : `${app_service}/read/${this.uuid}/${uri_key}`;
            cosmos.query(url).then(function (res)
            {
                resolve(res.result.value);
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
    async txRead(key, gas_info)
    {
        assert(typeof key === 'string', 'Key must be a string');

        return this.do_tx({
            Key: key
        }, 'post', 'read', gas_info, function(res, resolve, reject)
        {
            const json = parse_result(res, reject);
            resolve(json.value);
        });
    }

    // returns a promise resolving to nothing.
    async delete(key, gas_info)
    {
        assert(typeof key === 'string', 'Key must be a string');

        return this.do_tx({
            Key: key
        }, 'delete', 'delete', gas_info, function(res, resolve, reject)
        {
            resolve();
        });
    }

    // returns a promise resolving to a boolean value - true or false, representing whether the key is in the database.
    async has(key)
    {
        assert(typeof key === 'string', 'Key must be a string');

        const uri_key = this.encode_safe(key);
        return this.do_query(`${app_service}/has/${this.uuid}/${uri_key}`, function(res, resolve, reject)
        {
            resolve(res.result.has);
        });
    }

    // returns a promise resolving to a boolean value - true or false, representing whether the key is in the database.
    txHas(key, gas_info)
    {
        assert(typeof key === 'string', 'Key must be a string');

        return this.do_tx({
            Key: key
        }, 'post', 'has', gas_info, function(res, resolve, reject)
        {
            const json = parse_result(res, reject);
            resolve(json.has);
        });
    }

    // returns a promise resolving to an array of strings. ex. ["key1", "key2", ...]
    async keys()
    {
        return this.do_query(`${app_service}/keys/${this.uuid}`, function(res, resolve, reject)
        {
            resolve(res.result.keys ? res.result.keys : []);
        });
    }

    // returns a promise resolving to an array of strings. ex. ["key1", "key2", ...]
    txKeys(gas_info)
    {
        return this.do_tx({}, 'post', 'keys', gas_info, function(res, resolve, reject)
        {
            const json = parse_result(res, reject);
            resolve(json.keys ? json.keys : []);
        });
    }

    // returns a promise resolving to nothing
    rename(key, new_key, gas_info)
    {
        assert(typeof key === 'string', 'Key must be a string');
        assert(typeof new_key === 'string', 'New key must be a string');

        return this.do_tx({
            Key: key,
            NewKey: new_key
        }, 'post', 'rename', gas_info, function(res, resolve, reject)
        {
            resolve();
        });
    }

    // returns a promise resolving to the number of keys/values
    count()
    {
        return this.do_query(`/${app_service}/count/${this.uuid}`, function(res, resolve, reject)
        {
            resolve(parseInt(res.result.count));
        });
    }

    // returns a promise resolving to the number of keys/values
    txCount(gas_info)
    {
        return this.do_tx({}, 'post', 'count', gas_info, function(res, resolve, reject)
        {
            const json = parse_result(res, reject);
            resolve(json.count);
        });
    }

    // returns a promise resolving to nothing
    deleteAll(gas_info)
    {
        return this.do_tx({}, 'post', 'deleteall', gas_info, function(res, resolve, reject)
        {
            resolve();
        });
    }

    // returns a promise resolving to a JSON array containing keys and values
    keyValues()
    {
        return this.do_query(`/${app_service}/keyvalues/${this.uuid}`, function(res, resolve, reject)
        {
            resolve(res.result.keyvalues);
        });
    }

    // returns a promise resolving to a JSON array containing keys and values
    txKeyValues(gas_info)
    {
        return this.do_tx({}, 'post', 'keyvalues', gas_info, function(res, resolve, reject)
        {
            const json = parse_result(res, reject);
            resolve(json.keyvalues);
        });
    }

    // returns a promise resolving to nothing.
    async multiUpdate(keyvalues, gas_info)
    {
        assert(typeof keyvalues === 'object', 'Keyvalues must be an array');
        keyvalues.forEach(function(value, index, array)
        {
            assert(typeof value.key === 'string', "All keys must be strings");
            assert(typeof value.value === 'string', "All values must be strings");
        });

        return this.do_tx({
            KeyValues: keyvalues
        }, 'post', 'multiupdate', gas_info, function(res, resolve, reject)
        {
            resolve();
        });
    }

    // returns a promise resolving to an integral value in seconds, representing the lease time remaining on the key
    async getLease(key)
    {
        assert(typeof key === 'string', 'Key must be a string');

        const uri_key = this.encode_safe(key);
        return this.do_query(`${app_service}/getlease/${this.uuid}/${uri_key}`, function(res, resolve, reject)
        {
            resolve(res.result.lease * BLOCK_TIME_IN_SECONDS);
        });
    }

    // returns a promise resolving to nothing.
    txGetLease(key, gas_info)
    {
        assert(typeof key === 'string', 'Key must be a string');

        return this.do_tx({
            Key: key
        }, 'post', 'getlease', gas_info, function(res, resolve, reject)
        {
            const json = parse_result(res, reject);
            resolve(json.lease * BLOCK_TIME_IN_SECONDS);
        });
    }

    // returns a promise resolving to nothing.
    renewLease(key, gas_info, lease_info)
    {
        assert(typeof key === 'string', 'Key must be a string');

        const blocks = this.convert_lease(lease_info);
        if (blocks < 0)
        {
            throw new Error("Invalid lease time");
        }

        return this.do_tx({
            Key: key,
            Lease: blocks
        }, 'post', 'renewlease', gas_info, function(res, resolve, reject)
        {
            resolve();
        });
    }

    // returns a promise resolving to nothing.
    renewLeaseAll(gas_info, lease_info)
    {
        const blocks = this.convert_lease(lease_info);
        if (blocks < 0)
        {
            throw new Error("Invalid lease time");
        }

        return this.do_tx({
            Lease: blocks
        }, 'post', 'renewleaseall', gas_info, function(res, resolve, reject)
        {
            resolve();
        });
    }

    // returns a promise resolving to an array of key/lease-time pairs
    async getNShortestLease(n)
    {
        if (n < 0)
        {
            throw new Error("Invalid value specified");
        }

        return this.do_query(`${app_service}/getnshortestlease/${this.uuid}/${n}`, function(res, resolve, reject)
        {
            debugger;
            let lease_info = [];
            res.result.keyleases.forEach(function(val, i, leases)
            {
                lease_info.push({key: leases[i].key, lease: leases[i].lease * BLOCK_TIME_IN_SECONDS});
            });
            resolve(lease_info);
        });
    }

    // returns a promise resolving to an array of key/lease-time pairs
    txGetNShortestLease(n, gas_info)
    {
        if (n < 0)
        {
            throw new Error("Invalid value specified");
        }

        return this.do_tx(
            {
                N: n
            }, 'post', 'getnshortestlease', gas_info, function(res, resolve, reject)
        {
            const json = parse_result(res, reject);
            let lease_info = [];
            json.keyleases.forEach(function(val, i, leases)
            {
                lease_info.push({key: leases[i].key, lease: leases[i].lease * BLOCK_TIME_IN_SECONDS});
            });
            resolve(lease_info);
        });
    }


    // returns a promise resolving to a JSON object representing the user account data.
    async account()
    {
        return this.do_query(`auth/accounts/${this.address}`, function(res, resolve, reject)
        {
            resolve(res.result.value);
        });
    }

    // returns a promise resolving to a version string.
    async version()
    {
        return this.do_query('node_info', function(res, resolve, reject)
        {
            resolve(res.application_version.version);
        });
    }

    do_tx(params, type, cmd, gas_info, func)
    {
        const data = {
            BaseReq: {
                from: this.address,
                chain_id: this.chain_id
            },
            UUID: this.uuid,
            Owner: this.address,
        };

        Object.assign(data, params);

        return new Promise(async (resolve, reject) =>
        {
            cosmos.send_transaction(type, `${app_service}/${cmd}`, data, gas_info).then(function (res)
            {
                func(res, resolve, reject);
            }).catch(function (err)
            {
                reject(err);
            });
        });
    }

    do_query(ep, func)
    {
        return new Promise(async (resolve, reject) =>
        {
            cosmos.query(ep).then(function (res)
            {
                func(res, resolve, reject);
            }).catch(function (err)
            {
                reject(err);
            });
        });
    }

    convert_lease(lease_info)
    {
        let seconds = 0;
        if (typeof(lease_info) === 'undefined')
        {
            return '0';
        }

        seconds += lease_info.days ? (parseInt(lease_info.days) * 24 * 60 * 60) : 0;
        seconds += lease_info.hours ? (parseInt(lease_info.hours) * 60 * 60) : 0;
        seconds += lease_info.minutes ? (parseInt(lease_info.minutes) * 60) : 0;
        seconds += lease_info.seconds ? parseInt(lease_info.seconds) : 0;

        const blocks = seconds / BLOCK_TIME_IN_SECONDS;
        return `${blocks}`;
    }

    encode_safe(str)
    {
        let instr = encodeURI(str);
        let outstr = '';
        for (var i = 0; i < instr.length; i++)
        {
            const ch = instr[i];
            switch (ch)
            {
                case '#':
                case '?':
                    outstr += '%' + (ch.charCodeAt(0)).toString(16);
                    break;

                default:
                    outstr += ch;
                    break;
            }
        }

        return outstr;
    }
};
