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
        gas_info: {},
        lease_info: { days: '100' }
    };

const cosmos = require('../client/lib/swarmClient/cosmos');
const {API} = require('../client/lib/swarmClient/Api.js');
const {convertLease, encodeSafe} = require('../client/lib/swarmClient/util');
var expect = require('chai').expect;

var api = new API(params.address, params.mnemonic, params.endpoint, params.address, params.chain_id);

var old_init;
var old_send;
var old_query;

const app_service = "crud";
const BLOCK_TIME_IN_SECONDS = 5;

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

async function tx_error(msg, func)
{
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
        res = await func();
    }
    catch (err)
    {
        expect(err.message).equal(msg);
        fail = true;
    }
    expect(send_tx_called).equal(1);
    expect(fail).equal(true);
}

async function query_error(url, msg, func)
{
    cosmos.query = async (ep) =>
    {
        expect(ep).equal(url);
        return new Promise(async (resolve, reject) =>
        {
            reject(new Error(msg));
        });
    };

    var fail = false;
    try
    {
        res = await func();
    }
    catch (err)
    {
        expect(err.message).equal(msg);
        fail = true;
    }
    expect(fail).equal(true);

}

describe('testing init', () =>
{
    save_cosmos_functions();

    it('initializes', async () =>
    {
        cosmos.init = async (mnemonic, endpoint, address) =>
        {
            return true;
        };

        await api.init();
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
            expect(data.Lease).equal(convertLease(params.lease_info).toString());
            expect(gas_info).equal(params.gas_info);

            return new Promise(async (resolve, reject) =>
            {
                resolve();
            });
        };

        res = await api.create(key, value, params.gas_info, params.lease_info);
        expect(send_tx_called).equal(1);
        expect(typeof res).equal('undefined');
    });

    it('create error', async () =>
    {
        await tx_error('key already exists', function ()
        {
            return api.txRead(key, params.gas_info);
        });
    });
});

describe('testing txRead', () =>
{
    const key = 'key';
    const value = 'value';
    save_cosmos_functions();

    it('txRead success', async () =>
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

        res = await api.txRead(key, params.gas_info);
        expect(send_tx_called).equal(1);
        expect(res).equal(value);
    });

    it('txRead error', async () =>
    {
        await tx_error('key not found', function ()
        {
            return api.txRead(key, params.gas_info);
        });
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
//            expect(data.Lease).equal(convertLease(params.lease_info));
            expect(gas_info).equal(params.gas_info);

            return new Promise(async (resolve, reject) =>
            {
                resolve();
            });
        };

        res = await api.update(key, value, params.gas_info, params.lease_info);
        expect(send_tx_called).equal(1);
        expect(typeof res).equal('undefined');
    });

    it('update error', async () =>
    {
        await tx_error('key not found', function ()
        {
            return api.update(key, value, params.gas_info, params.lease_info);
        });
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
        await tx_error('key not found', function ()
        {
            return api.delete(key, params.gas_info);
        });
    });
});

describe('testing txHas', () =>
{
    const key = 'key';
    save_cosmos_functions();

    it('txHas success', async () =>
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

        res = await api.txHas(key, params.gas_info);
        expect(send_tx_called).equal(1);
        expect(res).equal(true);
    });

    it('txHas failure', async () =>
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

        res = await api.txHas(key, params.gas_info);
        expect(send_tx_called).equal(1);
        expect(res).equal(false);
    });

    it('txHas error', async () =>
    {
        await tx_error('error', function ()
        {
            return api.txHas(key, params.gas_info);
        });
    });
});

describe('testing txKeys', () =>
{
    save_cosmos_functions();

    it('txKeys success', async () =>
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

        res = await api.txKeys(params.gas_info);
        expect(send_tx_called).equal(1);
        expect(res).to.deep.equal(keys);
    });

    it('txKeys error', async () =>
    {
        await tx_error('An error occurred parsing the result', function ()
        {
            return api.txKeys(params.gas_info);
        });
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
                resolve({result: {value: value}});
            });
        };

        res = await api.read(key, false);
        expect(res).equal(value);
    });

    it('read-u error', async () =>
    {
        const key = 'key';
        const msg = 'key not found';
        const url = `${app_service}/read/${params.address}/${key}`;

        await query_error(url, msg, function()
        {
            return api.read(key, false);
        });
    });

    it('read-u with special characters', async () =>
    {
        const key = 'key/":!?*@#$%^&*()_+';
        const value = 'value';

        cosmos.query = async (ep) =>
        {
            const uri = encodeSafe(`${app_service}/read/${params.address}/${key}`);
            expect(ep).equal(uri);
            return new Promise(async (resolve, reject) =>
            {
                resolve({result: {value: value}});
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
                resolve({result: {value: value}});
            });
        };

        res = await api.read(key, true);
        expect(res).equal(value);
    });

    it('read-v error', async () =>
    {
        const key = 'key';
        const msg = 'key not found';
        const url = `${app_service}/pread/${params.address}/${key}`;

        await query_error(url, msg, function()
        {
            return api.read(key, true);
        });
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
                resolve({result: {"has": true}});
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
                resolve({result: {"has": false}});
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
                resolve({result: {keys: keys}});
            });
        };

        res = await api.keys();
        expect(res).to.deep.equal(keys);
    });

    it('keys error', async () =>
    {
        const msg = "An error occurred";
        const url = `${app_service}/keys/${params.address}`;

        await query_error(url, msg, function()
        {
            return api.keys();
        });
    });
});

describe('testing rename', () =>
{
    const key = 'key';
    const newkey = 'newkey';
    save_cosmos_functions();

    it('rename success', async () =>
    {
        var send_tx_called = 0;
        cosmos.send_transaction = async (req_type, ep_name, data, gas_info) =>
        {
            ++send_tx_called;
            expect(req_type).equal('post');
            expect(ep_name).equal(`${app_service}/rename`);
            expect(validate_common_data(data)).equal(true);
            expect(data.Key).equal(key);
            expect(data.NewKey).equal(newkey);
            expect(gas_info).equal(params.gas_info);

            return new Promise(async (resolve, reject) =>
            {
                resolve();
            });
        };

        res = await api.rename(key, newkey, params.gas_info);
        expect(send_tx_called).equal(1);
        expect(typeof res).equal('undefined');
    });

    it('rename error', async () =>
    {
        await tx_error('key not found', function ()
        {
            return api.rename(key, newkey, params.gas_info);
        });
    });
});

describe('testing count', () =>
{
    save_cosmos_functions();
    var count = 10;

    it('count success', async () =>
    {
        cosmos.query = async (ep) =>
        {
            expect(ep).equal(`/crud/count/${params.address}`);

            return new Promise(async (resolve, reject) =>
            {
                resolve({result: {"count": count}});
            });
        };

        res = await api.count();
        expect(res).equal(count);
    });

    it('count error', async () =>
    {
        const msg = "An error occurred";
        const url = `/crud/count/${params.address}`;

        await query_error(url, msg, function()
        {
            return api.count();
        });
    });
});

describe('testing txCount', () =>
{
    save_cosmos_functions();

    it('txCount success', async () =>
    {
        var count = 10;
        var send_tx_called = 0;
        cosmos.send_transaction = async (req_type, ep_name, data, gas_info) =>
        {
            ++send_tx_called;
            expect(req_type).equal('post');
            expect(ep_name).equal(`${app_service}/count`);
            expect(validate_common_data(data)).equal(true);
            expect(gas_info).equal(params.gas_info);

            return new Promise(async (resolve, reject) =>
            {
                const str = `{"count": ${count}}`;
                resolve(string2hex(str));
            });
        };

        res = await api.txCount(params.gas_info);
        expect(send_tx_called).equal(1);
        expect(res).equal(count);
    });

    it('txCount error', async () =>
    {
        await tx_error('An error occurred', function ()
        {
            return api.txCount(params.gas_info);
        });
    });
});

describe('testing deleteAll', () =>
{
    save_cosmos_functions();

    it('deleteAll success', async () =>
    {
        var send_tx_called = 0;
        cosmos.send_transaction = async (req_type, ep_name, data, gas_info) =>
        {
            ++send_tx_called;
            expect(req_type).equal('post');
            expect(ep_name).equal(`${app_service}/deleteall`);
            expect(validate_common_data(data)).equal(true);
            expect(gas_info).equal(params.gas_info);

            return new Promise(async (resolve, reject) =>
            {
                resolve();
            });
        };

        res = await api.deleteAll(params.gas_info);
        expect(send_tx_called).equal(1);
        expect(typeof res).equal('undefined');
    });

    it('deleteAll error', async () =>
    {
        await tx_error('An error occurred', function ()
        {
            return api.deleteAll(params.gas_info);
        });
    });
});

describe('testing keyValues', () =>
{
    save_cosmos_functions();
    var kvs = {"keyvalues": [{"key": "key1", "value": "value1"}, {"key": "key2", "value": "value2"}]};

    it('keyValues success', async () =>
    {
        cosmos.query = async (ep) =>
        {
            expect(ep).equal(`/crud/keyvalues/${params.address}`);

            return new Promise(async (resolve, reject) =>
            {
                resolve({result: kvs});
            });
        };

        res = await api.keyValues();
        expect(res).equal(kvs.keyvalues);
    });

    it('keyValues error', async () =>
    {
        const msg = "An error occurred";
        const url = `/crud/keyvalues/${params.address}`;

        await query_error(url, msg, function()
        {
            return api.keyValues();
        });
    });
});

describe('testing txKeyValues', () =>
{
    save_cosmos_functions();

    it('txKeyValues success', async () =>
    {
        var kvs = `{"keyvalues": [{"key": "key1", "value": "value1"}, {"key": "key2", "value": "value2"}]}`;
        var send_tx_called = 0;
        cosmos.send_transaction = async (req_type, ep_name, data, gas_info) =>
        {
            ++send_tx_called;
            expect(req_type).equal('post');
            expect(ep_name).equal(`${app_service}/keyvalues`);
            expect(validate_common_data(data)).equal(true);
            expect(gas_info).equal(params.gas_info);

            return new Promise(async (resolve, reject) =>
            {
                resolve(string2hex(kvs));
            });
        };

        res = await api.txKeyValues(params.gas_info);
        expect(send_tx_called).equal(1);
        expect(res).to.deep.equal(JSON.parse(kvs).keyvalues);
    });

    it('txKeyValues error', async () =>
    {
        await tx_error('An error occurred', function ()
        {
            return api.txKeyValues(params.gas_info);
        });
    });
});

describe('testing mutliupdate', () =>
{
    const kvs = [{key: 'key1', value: 'value1'},{key: 'key2', value: 'value2'}];
    save_cosmos_functions();

    it('mutliupdate success', async () =>
    {
        var send_tx_called = 0;
        cosmos.send_transaction = async (req_type, ep_name, data, gas_info) =>
        {
            ++send_tx_called;
            expect(req_type).equal('post');
            expect(ep_name).equal(`${app_service}/multiupdate`);
            expect(validate_common_data(data)).equal(true);
            expect(data.KeyValues).to.deep.equal(kvs);
            expect(gas_info).equal(params.gas_info);

            return new Promise(async (resolve, reject) =>
            {
                resolve();
            });
        };

        res = await api.multiUpdate(kvs, params.gas_info);
        expect(send_tx_called).equal(1);
        expect(typeof res).equal('undefined');
    });

    it('mutliupdate error', async () =>
    {
        await tx_error('Key does not exist [0]', function ()
        {
            return api.multiUpdate(kvs, params.gas_info);
        });
    });
});

describe('testing getLease', () =>
{
    save_cosmos_functions();

    it('getLease success', async () =>
    {
        const key = 'key!@#$%^&*()_+';
        const lease = 100;

        cosmos.query = async (ep) =>
        {
            const uri = encodeSafe(`${app_service}/getlease/${params.address}/${key}`);
            expect(ep).equal(uri);
            return new Promise(async (resolve, reject) =>
            {
                resolve({result: {lease: lease}});
            });
        };

        res = await api.getLease(key);
        expect(res).equal(lease * BLOCK_TIME_IN_SECONDS);
    });

    it('getLease error', async () =>
    {
        const key = 'key';
        const msg = 'key not found';
        const url = `${app_service}/getlease/${params.address}/${key}`;

        await query_error(url, msg, function()
        {
            return api.getLease(key);
        });
    });

});

describe('testing txGetLease', () =>
{
    const key = 'key';
    const lease = 100;
    save_cosmos_functions();

    it('txGetLease success', async () =>
    {
        var send_tx_called = 0;
        cosmos.send_transaction = async (req_type, ep_name, data, gas_info) =>
        {
            ++send_tx_called;
            expect(req_type).equal('post');
            expect(ep_name).equal(`${app_service}/getlease`);
            expect(validate_common_data(data)).equal(true);
            expect(data.Key).equal(key);
            expect(gas_info).equal(params.gas_info);

            return new Promise(async (resolve, reject) =>
            {
                const str = `{"lease": "${lease}"}`;
                resolve(string2hex(str));
            });
        };

        res = await api.txGetLease(key, params.gas_info);
        expect(send_tx_called).equal(1);
        expect(res).equal(lease * BLOCK_TIME_IN_SECONDS);
    });

    it('txGetLease error', async () =>
    {
        await tx_error('key not found', function ()
        {
            return api.txGetLease(key, params.gas_info);
        });
    });
});

describe('testing renewLease', () =>
{
    const key = 'key';
    save_cosmos_functions();

    it('renewLease success', async () =>
    {
        var send_tx_called = 0;
        cosmos.send_transaction = async (req_type, ep_name, data, gas_info) =>
        {
            ++send_tx_called;
            expect(req_type).equal('post');
            expect(ep_name).equal(`${app_service}/renewlease`);
            expect(validate_common_data(data)).equal(true);
            expect(data.Key).equal(key);
            expect(data.Lease).equal(convertLease(params.lease_info).toString());
            expect(gas_info).equal(params.gas_info);

            return new Promise(async (resolve, reject) =>
            {
                resolve();
            });
        };

        res = await api.renewLease(key, params.gas_info, params.lease_info);
        expect(send_tx_called).equal(1);
        expect(typeof res).equal('undefined');
    });

    it('renewLease error', async () =>
    {
        await tx_error('key not found', function ()
        {
            return api.renewLease(key, params.gas_info, params.lease_info);
        });
    });
});

describe('testing renewLeaseAll', () =>
{
    save_cosmos_functions();

    it('renewLeaseAll success', async () =>
    {
        var send_tx_called = 0;
        cosmos.send_transaction = async (req_type, ep_name, data, gas_info) =>
        {
            ++send_tx_called;
            expect(req_type).equal('post');
            expect(ep_name).equal(`${app_service}/renewleaseall`);
            expect(validate_common_data(data)).equal(true);
            expect(data.Lease).equal(convertLease(params.lease_info).toString());
            expect(gas_info).equal(params.gas_info);

            return new Promise(async (resolve, reject) =>
            {
                resolve();
            });
        };

        res = await api.renewLeaseAll(params.gas_info, params.lease_info);
        expect(send_tx_called).equal(1);
        expect(typeof res).equal('undefined');
    });

    it('renewLeaseAll error', async () =>
    {
        await tx_error('key not found', function ()
        {
            return api.renewLeaseAll(params.gas_info, params.lease_info);
        });
    });
});

describe('testing getNShortestLeases', () =>
{
    const n = 10;
    const leases = [{key: 'key1', lease: 100}, {key: 'key2', lease: 200}];
    save_cosmos_functions();

    it('getNShortestLeases success', async () =>
    {
        cosmos.query = async (ep) =>
        {
            expect(ep).equal(`${app_service}/getnshortestleases/${params.address}/${n}`);

            return new Promise(async (resolve, reject) =>
            {
                resolve({result: {"keyleases": leases}});
            });
        };

        res = await api.getNShortestLeases(n);
        res.forEach(function(val, i, lease_info)
        {
            expect(lease_info[i].key).equal(leases[i].key);
            expect(lease_info[i].lease).equal(leases[i].lease * BLOCK_TIME_IN_SECONDS);
        });
    });

    it('getNShortestLeases error', async () =>
    {
        const msg = "An error occurred";
        const url = `${app_service}/getnshortestleases/${params.address}/${n}`;

        await query_error(url, msg, function()
        {
            return api.getNShortestLeases(n);
        });
    });
});

describe('testing txGetNShortestLeases', () =>
{
    save_cosmos_functions();
    const n = 10;
    const leases = [{key: 'key1', lease: 100}, {key: 'key2', lease: 200}];

    it('txGetNShortestLeases success', async () =>
    {
        var send_tx_called = 0;
        cosmos.send_transaction = async (req_type, ep_name, data, gas_info) =>
        {
            ++send_tx_called;
            expect(req_type).equal('post');
            expect(ep_name).equal(`${app_service}/getnshortestleases`);
            expect(validate_common_data(data)).equal(true);
            expect(data.N).equal(n);
            expect(gas_info).equal(params.gas_info);

            return new Promise(async (resolve, reject) =>
            {
                const lease_info = JSON.stringify(leases);
                const str = `{"keyleases": ${lease_info}}`;
                resolve(string2hex(str));
            });
        };

        res = await api.txGetNShortestLeases(n, params.gas_info);
        expect(send_tx_called).equal(1);
        expect(typeof res).equal('object');
        expect(res.length).equal(leases.length);
        res.forEach(function(val, i, lease_info)
        {
            expect(lease_info[i].key).equal(leases[i].key);
            expect(lease_info[i].lease).equal(leases[i].lease * BLOCK_TIME_IN_SECONDS);
        });
    });

    it('txGetNShortestLeases error', async () =>
    {
        await tx_error('An error occurred', function ()
        {
            return api.txGetNShortestLeases(n, params.gas_info);
        });
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
            expect(ep).equal(`auth/accounts/${params.address}`);

            return new Promise(async (resolve, reject) =>
            {
                resolve({result: account_info});
            });
        };

        res = await api.account();
        expect(res).to.deep.equal(account_info.value);
    });

    it('account error', async () =>
    {
        const msg = "An error occurred";
        const url = `auth/accounts/${params.address}`;

        await query_error(url, msg, function()
        {
            return api.account();
        });
    });
});

describe('testing version', () =>
{
    save_cosmos_functions();

    it('version success', async () =>
    {
        const version_info =
            {
                "name": "BluzelleService",
                "server_name": "blzd",
                "client_name": "blzcli",
                "version": "0.0.0-39-g8895e3e",
                "commit": "8895e3edf0a3ede0f6ed30f2224930e8faa1236e",
                "build_tags": "ledger,faucet,cosmos-sdk v0.38.1",
                "go": "go version go1.13.4 linux/amd64"
            };

        cosmos.query = async (ep) =>
        {
            expect(ep).equal(`node_info`);

            return new Promise(async (resolve, reject) =>
            {
                resolve({application_version: version_info});
            });
        };

        res = await api.version();
        expect(res).equal(version_info.version);
    });

    it('version error', async () =>
    {
        const msg = "An error occurred";
        const url = `node_info`;

        await query_error(url, msg, function()
        {
            return api.version();
        });
    });
});
