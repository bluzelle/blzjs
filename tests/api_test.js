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

const params =
    {
        // local
        address: 'bluzelle1xhz23a58mku7ch3hx8f9hrx6he6gyujq57y3kp',
        mnemonic: 'volcano arrest ceiling physical concert sunset absent hungry tobacco canal census era pretty car code crunch inside behind afraid express giraffe reflect stadium luxury',
        endpoint: "http://localhost:1317",
        chain_id: "bluzelle",
        gas_info: {}
    };


const API = require('../src/swarmClient/api.js');
var assert = require('chai').assert;
var expect = require('chai').expect;
var to = require('chai').to;
var deep = require('chai').deep;

var api = new API(params.address, params.mnemonic, params.endpoint, params.address, params.chain_id);

var old_init;
var old_send;
var old_query;

const app_service = "crud";

function string2hex(str)
{
    var hex = '';
    for (var i = 0; i < str.length; i ++)
        hex += Number(str.charCodeAt(i)).toString(16);
    return hex;
}

function validate_common_data(data)
{
    if (typeof data.BaseReq != 'object')
        return false;
    if (data.BaseReq.from !== params.address)
        return false;
    if (data.BaseReq.chain_id !== params.chain_id)
        return false;
    if (data.UUID !== params.address)
        return false;
    if (data.Owner !== params.address)
        return false;

    return true;
}

function save_cosmos_functions()
{
    beforeEach(() =>
    {
        old_init = cosmos.init;
        old_send = cosmos.send_transaction;
        old_query = cosmos.query;
    });
    afterEach(() =>
    {
        cosmos.init = old_init;
        cosmos.send_transaction = old_send;
        cosmos.query = old_query;
    });
}

describe('testing init', () =>
{
    save_cosmos_functions();

    it('initializes', async () =>
    {
        cosmos.init = async (mnemonic, endpoint) =>
        {
            return true;
        };

        res = await api.init();
        expect(res).equal(true);
    });
});

describe('testing create', () =>
{
    save_cosmos_functions();

    const key = 'key';
    const value = 'value';

    it('create success', async () =>
    {
        var send_tx_called = 0;
        cosmos.send_transaction = async (req_type, ep_name, data, gas_info) =>
        {
            ++send_tx_called;
            expect(req_type).equal('post');
            expect(ep_name).equal(`${app_service}/create`);
            expect(validate_common_data(data)).equal(true);
            expect(data.Key).equal(key);
            expect(data.Value).equal(value);
            expect(gas_info).equal(params.gas_info);

            return new Promise(async (resolve, reject) =>
            {
                resolve();
            });
        };

        res = await api.create(key, value, params.gas_info);
        expect(send_tx_called).equal(1);
        expect(typeof res).equal('undefined');
    });

    it('create error', async () =>
    {
        const msg = 'key already exists';
        var send_tx_called = 0;
        cosmos.send_transaction = async (req_type, ep_name, data, gas_info) =>
        {
            ++send_tx_called;

            return new Promise(async (resolve, reject) =>
            {
                reject(new Error(msg));
            });
        };

        var fail = false;
        try
        {
            res = await api.create(key, value, params.gas_info);
        }
        catch (err)
        {
            expect(err.message).equal(msg);
            fail = true;
        }
        expect(send_tx_called).equal(1);
        expect(fail).equal(true);
    });
});

describe('testing txread', () =>
{
    const key = 'key';
    const value = 'value';
    save_cosmos_functions();

    it('txread success', async () =>
    {
        var send_tx_called = 0;
        cosmos.send_transaction = async (req_type, ep_name, data, gas_info) =>
        {
            ++send_tx_called;
            expect(req_type).equal('post');
            expect(ep_name).equal(`${app_service}/read`);
            expect(validate_common_data(data)).equal(true);
            expect(data.Key).equal(key);
            expect(gas_info).equal(params.gas_info);

            return new Promise(async (resolve, reject) =>
            {
                const str = `{"value": "${value}"}`;
                resolve(string2hex(str));
            });
        };

        res = await api.txread(key, params.gas_info);
        expect(send_tx_called).equal(1);
        expect(res).equal(value);
    });

    it('txread error', async () =>
    {
        const msg = 'key not found';
        var send_tx_called = 0;
        cosmos.send_transaction = async (req_type, ep_name, data, gas_info) =>
        {
            ++send_tx_called;

            return new Promise(async (resolve, reject) =>
            {
                reject(new Error(msg));
            });
        };

        var fail = false;
        try
        {
            res = await api.txread(key, params.gas_info);
        }
        catch (err)
        {
            expect(err.message).equal(msg);
            fail = true;
        }
        expect(send_tx_called).equal(1);
        expect(fail).equal(true);
    });
});

describe('testing update', () =>
{
    const key = 'key';
    const value = 'value';
    save_cosmos_functions();

    it('update success', async () =>
    {
        var send_tx_called = 0;
        cosmos.send_transaction = async (req_type, ep_name, data, gas_info) =>
        {
            ++send_tx_called;
            expect(req_type).equal('post');
            expect(ep_name).equal(`${app_service}/update`);
            expect(validate_common_data(data)).equal(true);
            expect(data.Key).equal(key);
            expect(data.Value).equal(value);
            expect(gas_info).equal(params.gas_info);

            return new Promise(async (resolve, reject) =>
            {
                resolve();
            });
        };

        res = await api.update(key, value, params.gas_info);
        expect(send_tx_called).equal(1);
        expect(typeof res).equal('undefined');
    });

    it('update error', async () =>
    {
        const msg = 'key not found';
        var send_tx_called = 0;
        cosmos.send_transaction = async (req_type, ep_name, data, gas_info) =>
        {
            ++send_tx_called;

            return new Promise(async (resolve, reject) =>
            {
                reject(new Error(msg));
            });
        };

        var fail = false;
        try
        {
            res = await api.update(key, value, params.gas_info);
        }
        catch (err)
        {
            expect(err.message).equal(msg);
            fail = true;
        }
        expect(send_tx_called).equal(1);
        expect(fail).equal(true);
    });
});

describe('testing delete', () =>
{
    const key = 'key';
    const value = 'value';
    save_cosmos_functions();

    it('delete success', async () =>
    {
        var send_tx_called = 0;
        cosmos.send_transaction = async (req_type, ep_name, data, gas_info) =>
        {
            ++send_tx_called;
            expect(req_type).equal('delete');
            expect(ep_name).equal(`${app_service}/delete`);
            expect(validate_common_data(data)).equal(true);
            expect(data.Key).equal(key);
            expect(gas_info).equal(params.gas_info);

            return new Promise(async (resolve, reject) =>
            {
                resolve();
            });
        };

        res = await api.delete(key, params.gas_info);
        expect(send_tx_called).equal(1);
        expect(typeof res).equal('undefined');
    });

    it('delete error', async () =>
    {
        const msg = 'key not found';
        var send_tx_called = 0;
        cosmos.send_transaction = async (req_type, ep_name, data, gas_info) =>
        {
            ++send_tx_called;

            return new Promise(async (resolve, reject) =>
            {
                reject(new Error(msg));
            });
        };

        var fail = false;
        try
        {
            res = await api.delete(key, params.gas_info);
        }
        catch (err)
        {
            expect(err.message).equal(msg);
            fail = true;
        }
        expect(send_tx_called).equal(1);
        expect(fail).equal(true);
    });
});

describe('testing txhas', () =>
{
    const key = 'key';
    save_cosmos_functions();

    it('txhas success', async () =>
    {
        var send_tx_called = 0;
        cosmos.send_transaction = async (req_type, ep_name, data, gas_info) =>
        {
            ++send_tx_called;
            expect(req_type).equal('post');
            expect(ep_name).equal(`${app_service}/has`);
            expect(validate_common_data(data)).equal(true);
            expect(data.Key).equal(key);
            expect(gas_info).equal(params.gas_info);

            return new Promise(async (resolve, reject) =>
            {
                const str = `{"has": true}`;
                resolve(string2hex(str));
            });
        };

        res = await api.txhas(key, params.gas_info);
        expect(send_tx_called).equal(1);
        expect(res).equal(true);
    });

    it('txhas failure', async () =>
    {
        var send_tx_called = 0;
        cosmos.send_transaction = async (req_type, ep_name, data, gas_info) =>
        {
            ++send_tx_called;
            expect(req_type).equal('post');
            expect(ep_name).equal(`${app_service}/has`);
            expect(validate_common_data(data)).equal(true);
            expect(data.Key).equal(key);
            expect(gas_info).equal(params.gas_info);

            return new Promise(async (resolve, reject) =>
            {
                const str = `{"has": false}`;
                resolve(string2hex(str));
            });
        };

        res = await api.txhas(key, params.gas_info);
        expect(send_tx_called).equal(1);
        expect(res).equal(false);
    });

    it('txhas error', async () =>
    {
        const msg = 'error';
        var send_tx_called = 0;
        cosmos.send_transaction = async (req_type, ep_name, data, gas_info) =>
        {
            ++send_tx_called;

            return new Promise(async (resolve, reject) =>
            {
                reject(new Error(msg));
            });
        };

        var fail = false;
        try
        {
            res = await api.txhas(key, params.gas_info);
        }
        catch (err)
        {
            expect(err.message).equal(msg);
            fail = true;
        }
        expect(send_tx_called).equal(1);
        expect(fail).equal(true);
    });
});

describe('testing txkeys', () =>
{
    save_cosmos_functions();

    it('txkeys success', async () =>
    {
        var send_tx_called = 0;
        const keys = ['key1', 'key2', 'key3'];

        cosmos.send_transaction = async (req_type, ep_name, data, gas_info) =>
        {
            ++send_tx_called;
            expect(req_type).equal('post');
            expect(ep_name).equal(`${app_service}/keys`);
            expect(validate_common_data(data)).equal(true);
            expect(gas_info).equal(params.gas_info);

            return new Promise(async (resolve, reject) =>
            {
                var str = '{"keys": [';// + keys + '}';//[${keys}]}';
                for (var i = 0; i < keys.length; i++)
                {
                    str += `"${keys[i]}"`;
                    if (i < (keys.length - 1))
                    {
                        str += ','
                    }
                }
                str += ']}';
                resolve(string2hex(str));
            });
        };

        res = await api.txkeys(params.gas_info);
        expect(send_tx_called).equal(1);
        expect(res).to.deep.equal(keys);
    });

    it('txkeys error', async () =>
    {
        const msg = "An error occurred parsing the result";
        var send_tx_called = 0;
        const keys = ['key1', 'key2', 'key3'];

        cosmos.send_transaction = async (req_type, ep_name, data, gas_info) =>
        {
            ++send_tx_called;

            return new Promise(async (resolve, reject) =>
            {
                // this is the wrong format
                reject(new Error(msg));
            });
        };

        var fail = false;
        try
        {
            res = await api.txkeys(params.gas_info);
        }
        catch (err)
        {
            expect(err.message).equal(msg);
            fail = true;
        }
        expect(send_tx_called).equal(1);
        expect(fail).equal(true);
    });
});

describe('testing read unverified', () =>
{
    save_cosmos_functions();

    it('read-u success', async () =>
    {
        const key = 'key';
        const value = 'value';

        cosmos.query = async (ep) =>
        {
            expect(ep).equal(`${app_service}/read/${params.address}/${key}`);
            return new Promise(async (resolve, reject) =>
            {
                // this is the wrong format
                resolve({value: value});
            });
        };

        res = await api.read(key, false);
        expect(res).equal(value);
    });

    it('read-u error', async () =>
    {
        const key = 'key';
        const msg = 'key not found';

        cosmos.query = async (ep) =>
        {
            expect(ep).equal(`${app_service}/read/${params.address}/${key}`);
            return new Promise(async (resolve, reject) =>
            {
                reject(new Error(msg));
            });
        };

        var fail = false;
        try
        {
            res = await api.read(key, false);
        }
        catch (err)
        {
            expect(err.message).equal(msg);
            fail = true;
        }
        expect(fail).equal(true);
    });

    it('read-u with special characters', async () =>
    {
        const key = 'key#1%2&3';
        const value = 'value';

        cosmos.query = async (ep) =>
        {
            const uri = encodeURI(`${app_service}/read/${params.address}/${key}`);
            expect(ep).equal(uri);
            return new Promise(async (resolve, reject) =>
            {
                // this is the wrong format
                resolve({value: value});
            });
        };

        res = await api.read(key, false);
        expect(res).equal(value);
    });
});

describe('testing read verified', () =>
{
    save_cosmos_functions();

    it('read-v success', async () =>
    {
        const key = 'key';
        const value = 'value';

        cosmos.query = async (ep) =>
        {
            expect(ep).equal(`${app_service}/pread/${params.address}/${key}`);
            return new Promise(async (resolve, reject) =>
            {
                // this is the wrong format
                resolve({value: value});
            });
        };

        res = await api.read(key, true);
        expect(res).equal(value);
    });

    it('read-v error', async () =>
    {
        const key = 'key';
        const msg = 'key not found';

        cosmos.query = async (ep) =>
        {
            expect(ep).equal(`${app_service}/pread/${params.address}/${key}`);
            return new Promise(async (resolve, reject) =>
            {
                reject(new Error(msg));
            });
        };

        var fail = false;
        try
        {
            res = await api.read(key, true);
        }
        catch (err)
        {
            expect(err.message).equal(msg);
            fail = true;
        }
        expect(fail).equal(true);
    });
});

describe('testing has', () =>
{
    const key = 'key';
    save_cosmos_functions();

    it('has success', async () =>
    {
        cosmos.query = async (ep) =>
        {
            expect(ep).equal(`${app_service}/has/${params.address}/${key}`);

            return new Promise(async (resolve, reject) =>
            {
                resolve({"has": true});
            });
        };

        res = await api.has(key);
        expect(res).equal(true);
    });

    it('has failure', async () =>
    {
        cosmos.query = async (ep) =>
        {
            expect(ep).equal(`${app_service}/has/${params.address}/${key}`);

            return new Promise(async (resolve, reject) =>
            {
                resolve({"has": false});
            });
        };

        res = await api.has(key);
        expect(res).equal(false);
    });
});

describe('testing keys', () =>
{
    save_cosmos_functions();

    it('keys success', async () =>
    {
        const keys = ['key1', 'key2', 'key3'];

        cosmos.query = async (ep) =>
        {
            expect(ep).equal(`${app_service}/keys/${params.address}`);

            return new Promise(async (resolve, reject) =>
            {
                resolve({keys: keys});
            });
        };

        res = await api.keys();
        expect(res).to.deep.equal(keys);
    });

    it('keys error', async () =>
    {
        const msg = "An error occurred";
        var send_tx_called = 0;

        cosmos.query = async (ep) =>
        {
            expect(ep).equal(`${app_service}/keys/${params.address}`);

            return new Promise(async (resolve, reject) =>
            {
                reject(new Error(msg));
            });
        };

        var fail = false;
        try
        {
            res = await api.keys();
        }
        catch (err)
        {
            expect(err.message).equal(msg);
            fail = true;
        }
        expect(fail).equal(true);
    });
});

describe('testing account', () =>
{
    save_cosmos_functions();

    it('account success', async () =>
    {
        const account_info = { value:
            { address: 'bluzelle1lgpau85z0hueyz6rraqqnskzmcz4zuzkfeqls7',
            coins: [ { denom: 'bnt', amount: '9899567400' } ],
            public_key: 'bluzellepub1addwnpepqd63w08dcrleyukxs4kq0n7ngalgyjdnu7jpf5khjmpykskyph2vypv6wms',
            account_number: 3,
            sequence: 218 }};

        cosmos.query = async (ep) =>
        {
            expect(ep).equal(`/auth/accounts/${params.address}`);

            return new Promise(async (resolve, reject) =>
            {
                resolve(account_info);
            });
        };

        res = await api.account();
        expect(res).to.deep.equal(account_info.value);
    });

    it('account error', async () =>
    {
        const msg = "An error occurred";
        var send_tx_called = 0;

        cosmos.query = async (ep) =>
        {
            expect(ep).equal(`/auth/accounts/${params.address}`);

            return new Promise(async (resolve, reject) =>
            {
                reject(new Error(msg));
            });
        };

        var fail = false;
        try
        {
            res = await api.account();
        }
        catch (err)
        {
            expect(err.message).equal(msg);
            fail = true;
        }
        expect(fail).equal(true);
    });
});
