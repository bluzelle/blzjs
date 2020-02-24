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

function string2hex(str)
{
    var hex = '';
    for (var i = 0; i < str.length; i ++)
        hex += Number(str.charCodeAt(i)).toString(16);
    return hex;
}

cosmos.init = async (mnemonic, endpoint) =>
{
    return true;
};

cosmos.query = async (ep) =>
{
    console.log("query called");
};

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

describe('testing init', () =>
{
    it('initializes', async () =>
    {
        res = await api.init();
        expect(res).equal(true);
    });
});

describe('testing create', () =>
{
    const key = 'key';
    const value = 'value';

    it('create success', async () =>
    {
        var send_tx_called = 0;
        cosmos.send_transaction = async (req_type, ep_name, data, gas_info) =>
        {
            ++send_tx_called;
            expect(req_type).equal('post');
            expect(ep_name).equal('create');
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
                reject(msg);
            });
        };

        var fail = false;
        try
        {
            res = await api.create(key, value, params.gas_info);
        }
        catch (err)
        {
            expect(err).equal(msg);
            fail = true;
        }
        expect(send_tx_called).equal(1);
        expect(fail).equal(true);
    });
});

describe('testing read', () =>
{
    const key = 'key';
    const value = 'value';

    it('read success', async () =>
    {
        var send_tx_called = 0;
        cosmos.send_transaction = async (req_type, ep_name, data, gas_info) =>
        {
            ++send_tx_called;
            expect(req_type).equal('post');
            expect(ep_name).equal('read');
            expect(validate_common_data(data)).equal(true);
            expect(data.Key).equal(key);
            expect(gas_info).equal(params.gas_info);

            return new Promise(async (resolve, reject) =>
            {
                const str = `{"value": "${value}"}`;
                resolve({data: {data: string2hex(str)}});
            });
        };

        res = await api.read(key, params.gas_info);
        expect(send_tx_called).equal(1);
        expect(res).equal(value);
    });

    it('read error', async () =>
    {
        const msg = 'key not found';
        var send_tx_called = 0;
        cosmos.send_transaction = async (req_type, ep_name, data, gas_info) =>
        {
            ++send_tx_called;

            return new Promise(async (resolve, reject) =>
            {
                reject(msg);
            });
        };

        var fail = false;
        try
        {
            res = await api.read(key, value, params.gas_info);
        }
        catch (err)
        {
            expect(err).equal(msg);
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

    it('update success', async () =>
    {
        var send_tx_called = 0;
        cosmos.send_transaction = async (req_type, ep_name, data, gas_info) =>
        {
            ++send_tx_called;
            expect(req_type).equal('post');
            expect(ep_name).equal('update');
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
                reject(msg);
            });
        };

        var fail = false;
        try
        {
            res = await api.update(key, value, params.gas_info);
        }
        catch (err)
        {
            expect(err).equal(msg);
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

    it('delete success', async () =>
    {
        var send_tx_called = 0;
        cosmos.send_transaction = async (req_type, ep_name, data, gas_info) =>
        {
            ++send_tx_called;
            expect(req_type).equal('delete');
            expect(ep_name).equal('delete');
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
                reject(msg);
            });
        };

        var fail = false;
        try
        {
            res = await api.delete(key, params.gas_info);
        }
        catch (err)
        {
            expect(err).equal(msg);
            fail = true;
        }
        expect(send_tx_called).equal(1);
        expect(fail).equal(true);
    });
});

describe('testing has', () =>
{
    const key = 'key';

    it('has success', async () =>
    {
        var send_tx_called = 0;
        cosmos.send_transaction = async (req_type, ep_name, data, gas_info) =>
        {
            ++send_tx_called;
            expect(req_type).equal('post');
            expect(ep_name).equal('has');
            expect(validate_common_data(data)).equal(true);
            expect(data.Key).equal(key);
            expect(gas_info).equal(params.gas_info);

            return new Promise(async (resolve, reject) =>
            {
                const str = `{"has": true}`;
                resolve({data: {data: string2hex(str)}});
            });
        };

        res = await api.has(key, params.gas_info);
        expect(send_tx_called).equal(1);
        expect(res).equal(true);
    });

    it('has failure', async () =>
    {
        var send_tx_called = 0;
        cosmos.send_transaction = async (req_type, ep_name, data, gas_info) =>
        {
            ++send_tx_called;
            expect(req_type).equal('post');
            expect(ep_name).equal('has');
            expect(validate_common_data(data)).equal(true);
            expect(data.Key).equal(key);
            expect(gas_info).equal(params.gas_info);

            return new Promise(async (resolve, reject) =>
            {
                const str = `{"has": false}`;
                resolve({data: {data: string2hex(str)}});
            });
        };

        res = await api.has(key, params.gas_info);
        expect(send_tx_called).equal(1);
        expect(res).equal(false);
    });

    it('has error', async () =>
    {
        const msg = 'error';
        var send_tx_called = 0;
        cosmos.send_transaction = async (req_type, ep_name, data, gas_info) =>
        {
            ++send_tx_called;

            return new Promise(async (resolve, reject) =>
            {
                reject(msg);
            });
        };

        var fail = false;
        try
        {
            res = await api.has(key, params.gas_info);
        }
        catch (err)
        {
            expect(err).equal(msg);
            fail = true;
        }
        expect(send_tx_called).equal(1);
        expect(fail).equal(true);
    });
});

describe('testing keys', () =>
{
    it('keys success', async () =>
    {
        var send_tx_called = 0;
        const keys = ['key1', 'key2', 'key3'];

        cosmos.send_transaction = async (req_type, ep_name, data, gas_info) =>
        {
            ++send_tx_called;
            expect(req_type).equal('post');
            expect(ep_name).equal('keys');
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
                resolve({data: {data: string2hex(str)}});
            });
        };

        res = await api.keys(params.gas_info);
        expect(send_tx_called).equal(1);
    debugger;
        expect(res).to.deep.equal(keys);
    });

    it('keys error', async () =>
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
                resolve(keys);
            });
        };

        var fail = false;
        try
        {
            res = await api.keys(params.gas_info);
        }
        catch (err)
        {
            expect(err).equal(msg);
            fail = true;
        }
        expect(send_tx_called).equal(1);
        expect(fail).equal(true);
    });
});

describe('testing ', () =>
{
});

describe('testing ', () =>
{
});

describe('testing ', () =>
{
});

describe('testing ', () =>
{
});

describe('testing ', () =>
{
});

describe('testing ', () =>
{
});

describe('testing ', () =>
{
});

describe('testing ', () =>
{
});

describe('testing ', () =>
{
});

describe('testing ', () =>
{
});

