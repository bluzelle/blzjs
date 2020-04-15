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

const params = {
  // local
  address: 'bluzelle1xhz23a58mku7ch3hx8f9hrx6he6gyujq57y3kp',
  mnemonic:
    'volcano arrest ceiling physical concert sunset absent hungry tobacco canal census era pretty car code crunch inside behind afraid express giraffe reflect stadium luxury', // eslint-disable-line max-len
  endpoint: 'http://localhost:1317',
  chain_id: 'bluzelle',
  gasInfo: {},
  lease_info: { days: '100' },
};

const Api = require('../src/swarmClient/api');
const cosmos = require('../src/swarmClient/cosmos');
const expect = require('chai').expect;

const API = new Api(
  params.address,
  params.mnemonic,
  params.endpoint,
  params.address,
  params.chain_id
);

let oldInit;
let oldSend;
let oldQuery;

const APP_SERVICE = 'crud';
const BLOCK_TIME_IN_SECONDS = 5;

function string2hex(str) {
  let hex = '';
  for (let i = 0; i < str.length; i++)
    hex += Number(str.charCodeAt(i)).toString(16);
  return hex;
}

function validateCommonData(data) {
  if (typeof data.BaseReq !== 'object') return false;
  if (data.BaseReq.from !== params.address) return false;
  if (data.BaseReq.chain_id !== params.chain_id) return false;
  if (data.UUID !== params.address) return false;
  if (data.Owner !== params.address) return false;

  return true;
}

function saveCosmosFunctions() {
  beforeEach(() => {
    oldInit = cosmos.init;
    oldSend = cosmos.sendTransaction;
    oldQuery = cosmos.query;
  });
  afterEach(() => {
    cosmos.init = oldInit;
    cosmos.sendTransaction = oldSend;
    cosmos.query = oldQuery;
  });
}

async function txError(msg, func) {
  let sendTxCalled = 0;

  cosmos.sendTransaction = async (reqType, epName, data, gasInfo) => {
    ++sendTxCalled;
    return Promise.reject(new Error(msg));
  };

  let fail = false;
  try {
    await func();
  } catch (err) {
    expect(err.message).equal(msg);
    fail = true;
  }
  expect(sendTxCalled).equal(1);
  expect(fail).equal(true);
}

async function queryError(url, msg, func) {
  cosmos.query = async (ep) => {
    expect(ep).equal(url);
    return Promise.reject(new Error(msg));
  };

  let fail = false;
  try {
    await func();
  } catch (err) {
    expect(err.message).equal(msg);
    fail = true;
  }
  expect(fail).equal(true);
}

describe('testing init', () => {
  saveCosmosFunctions();

  it('initializes', async () => {
    cosmos.init = async (mnemonic, endpoint, address) => {
      return true;
    };
    await API.init();
  });
});

describe('testing create', () => {
  saveCosmosFunctions();

  const key = 'key';
  const value = 'value';

  it('create success', async () => {
    let sendTxCalled = 0;
    cosmos.sendTransaction = async (reqType, epName, data, gasInfo) => {
      ++sendTxCalled;
      expect(reqType).equal('post');
      expect(epName).equal(`${APP_SERVICE}/create`);
      expect(validateCommonData(data)).equal(true);
      expect(data.Key).equal(key);
      expect(data.Value).equal(value);
      expect(data.Lease).equal(API.convertLease(params.lease_info));
      expect(gasInfo).equal(params.gasInfo);
    };

    await API.create(key, value, params.gasInfo, params.lease_info);
    expect(sendTxCalled).equal(1);
    expect(typeof res).equal('undefined');
  });

  it('create error', async () => {
    await txError('key already exists', function () {
      return API.txRead(key, params.gasInfo);
    });
  });
});

describe('testing txRead', () => {
  const key = 'key';
  const value = 'value';
  saveCosmosFunctions();

  it('txRead success', async () => {
    let sendTxCalled = 0;
    cosmos.sendTransaction = async (reqType, epName, data, gasInfo) => {
      ++sendTxCalled;
      expect(reqType).equal('post');
      expect(epName).equal(`${APP_SERVICE}/read`);
      expect(validateCommonData(data)).equal(true);
      expect(data.Key).equal(key);
      expect(gasInfo).equal(params.gasInfo);

      const str = `{"value": "${value}"}`;
      return string2hex(str);
    };

    const res = await API.txRead(key, params.gasInfo);
    expect(sendTxCalled).equal(1);
    expect(res).equal(value);
  });

  it('txRead error', async () => {
    await txError('key not found', function () {
      return API.txRead(key, params.gasInfo);
    });
  });
});

describe('testing update', () => {
  const key = 'key';
  const value = 'value';
  saveCosmosFunctions();

  it('update success', async () => {
    let sendTxCalled = 0;
    cosmos.sendTransaction = async (reqType, epName, data, gasInfo) => {
      ++sendTxCalled;
      expect(reqType).equal('post');
      expect(epName).equal(`${APP_SERVICE}/update`);
      expect(validateCommonData(data)).equal(true);
      expect(data.Key).equal(key);
      expect(data.Value).equal(value);
      expect(data.Lease).equal(API.convertLease(params.lease_info));
      expect(gasInfo).equal(params.gasInfo);
    };

    const res = await API.update(key, value, params.gasInfo, params.lease_info);
    expect(sendTxCalled).equal(1);
    expect(typeof res).equal('undefined');
  });

  it('update error', async () => {
    await txError('key not found', function () {
      return API.update(key, value, params.gasInfo, params.lease_info);
    });
  });
});

describe('testing delete', () => {
  const key = 'key';
  // const value = 'value';
  saveCosmosFunctions();

  it('delete success', async () => {
    let sendTxCalled = 0;
    cosmos.sendTransaction = async (reqType, epName, data, gasInfo) => {
      ++sendTxCalled;
      expect(reqType).equal('delete');
      expect(epName).equal(`${APP_SERVICE}/delete`);
      expect(validateCommonData(data)).equal(true);
      expect(data.Key).equal(key);
      expect(gasInfo).equal(params.gasInfo);
    };

    const res = await API.delete(key, params.gasInfo);
    expect(sendTxCalled).equal(1);
    expect(typeof res).equal('undefined');
  });

  it('delete error', async () => {
    await txError('key not found', function () {
      return API.delete(key, params.gasInfo);
    });
  });
});

describe('testing txHas', () => {
  const key = 'key';
  saveCosmosFunctions();

  it('txHas success', async () => {
    let sendTxCalled = 0;
    cosmos.sendTransaction = async (reqType, epName, data, gasInfo) => {
      ++sendTxCalled;
      expect(reqType).equal('post');
      expect(epName).equal(`${APP_SERVICE}/has`);
      expect(validateCommonData(data)).equal(true);
      expect(data.Key).equal(key);
      expect(gasInfo).equal(params.gasInfo);

      const str = '{"has": true}';
      return string2hex(str);
    };

    const res = await API.txHas(key, params.gasInfo);
    expect(sendTxCalled).equal(1);
    expect(res).equal(true);
  });

  it('txHas failure', async () => {
    let sendTxCalled = 0;
    cosmos.sendTransaction = async (reqType, epName, data, gasInfo) => {
      ++sendTxCalled;
      expect(reqType).equal('post');
      expect(epName).equal(`${APP_SERVICE}/has`);
      expect(validateCommonData(data)).equal(true);
      expect(data.Key).equal(key);
      expect(gasInfo).equal(params.gasInfo);

      const str = '{"has": false}';
      return string2hex(str);
    };

    const res = await API.txHas(key, params.gasInfo);
    expect(sendTxCalled).equal(1);
    expect(res).equal(false);
  });

  it('txHas error', async () => {
    await txError('error', function () {
      return API.txHas(key, params.gasInfo);
    });
  });
});

describe('testing txKeys', () => {
  saveCosmosFunctions();

  it('txKeys success', async () => {
    let sendTxCalled = 0;
    const keys = ['key1', 'key2', 'key3'];

    cosmos.sendTransaction = async (reqType, epName, data, gasInfo) => {
      ++sendTxCalled;
      expect(reqType).equal('post');
      expect(epName).equal(`${APP_SERVICE}/keys`);
      expect(validateCommonData(data)).equal(true);
      expect(gasInfo).equal(params.gasInfo);

      let str = '{"keys": ['; // + keys + '}';//[${keys}]}';
      for (let i = 0; i < keys.length; i++) {
        str += `"${keys[i]}"`;
        if (i < keys.length - 1) {
          str += ',';
        }
      }
      str += ']}';
      return string2hex(str);
    };

    const res = await API.txKeys(params.gasInfo);
    expect(sendTxCalled).equal(1);
    expect(res).to.deep.equal(keys);
  });

  it('txKeys error', async () => {
    await txError('An error occurred parsing the result', function () {
      return API.txKeys(params.gasInfo);
    });
  });
});

describe('testing read unverified', () => {
  saveCosmosFunctions();

  it('read-u success', async () => {
    const key = 'key';
    const value = 'value';

    cosmos.query = async (ep) => {
      expect(ep).equal(`${APP_SERVICE}/read/${params.address}/${key}`);
      return { result: { value: value } };
    };

    const res = await API.read(key, false);
    expect(res).equal(value);
  });

  it('read-u error', async () => {
    const key = 'key';
    const msg = 'key not found';
    const url = `${APP_SERVICE}/read/${params.address}/${key}`;

    await queryError(url, msg, function () {
      return API.read(key, false);
    });
  });

  it('read-u with special characters', async () => {
    const key = 'key/":!?*@#$%^&*()_+';
    const value = 'value';

    cosmos.query = async (ep) => {
      const uri = API.encodeSafe(
        `${APP_SERVICE}/read/${params.address}/${key}`
      );
      expect(ep).equal(uri);
      return { result: { value: value } };
    };

    const res = await API.read(key, false);
    expect(res).equal(value);
  });
});

describe('testing read verified', () => {
  saveCosmosFunctions();

  it('read-v success', async () => {
    const key = 'key';
    const value = 'value';

    cosmos.query = async (ep) => {
      expect(ep).equal(`${APP_SERVICE}/pread/${params.address}/${key}`);
      // this is the wrong format
      return { result: { value: value } };
    };

    const res = await API.read(key, true);
    expect(res).equal(value);
  });

  it('read-v error', async () => {
    const key = 'key';
    const msg = 'key not found';
    const url = `${APP_SERVICE}/pread/${params.address}/${key}`;

    await queryError(url, msg, function () {
      return API.read(key, true);
    });
  });
});

describe('testing has', () => {
  const key = 'key';
  saveCosmosFunctions();

  it('has success', async () => {
    cosmos.query = async (ep) => {
      expect(ep).equal(`${APP_SERVICE}/has/${params.address}/${key}`);
      return { result: { has: true } };
    };

    const res = await API.has(key);
    expect(res).equal(true);
  });

  it('has failure', async () => {
    cosmos.query = async (ep) => {
      expect(ep).equal(`${APP_SERVICE}/has/${params.address}/${key}`);

      return { result: { has: false } };
    };

    const res = await API.has(key);
    expect(res).equal(false);
  });
});

describe('testing keys', () => {
  saveCosmosFunctions();

  it('keys success', async () => {
    const keys = ['key1', 'key2', 'key3'];

    cosmos.query = async (ep) => {
      expect(ep).equal(`${APP_SERVICE}/keys/${params.address}`);

      return { result: { keys: keys } };
    };

    const res = await API.keys();
    expect(res).to.deep.equal(keys);
  });

  it('keys error', async () => {
    const msg = 'An error occurred';
    const url = `${APP_SERVICE}/keys/${params.address}`;

    await queryError(url, msg, function () {
      return API.keys();
    });
  });
});

describe('testing rename', () => {
  const key = 'key';
  const newkey = 'newkey';
  saveCosmosFunctions();

  it('rename success', async () => {
    let sendTxCalled = 0;
    cosmos.sendTransaction = async (reqType, epName, data, gasInfo) => {
      ++sendTxCalled;
      expect(reqType).equal('post');
      expect(epName).equal(`${APP_SERVICE}/rename`);
      expect(validateCommonData(data)).equal(true);
      expect(data.Key).equal(key);
      expect(data.NewKey).equal(newkey);
      expect(gasInfo).equal(params.gasInfo);
    };

    const res = await API.rename(key, newkey, params.gasInfo);
    expect(sendTxCalled).equal(1);
    expect(typeof res).equal('undefined');
  });

  it('rename error', async () => {
    await txError('key not found', function () {
      return API.rename(key, newkey, params.gasInfo);
    });
  });
});

describe('testing count', () => {
  saveCosmosFunctions();
  const count = 10;

  it('count success', async () => {
    cosmos.query = async (ep) => {
      expect(ep).equal(`/crud/count/${params.address}`);

      return { result: { count: count } };
    };

    const res = await API.count();
    expect(res).equal(count);
  });

  it('count error', async () => {
    const msg = 'An error occurred';
    const url = `/crud/count/${params.address}`;

    await queryError(url, msg, function () {
      return API.count();
    });
  });
});

describe('testing txCount', () => {
  saveCosmosFunctions();

  it('txCount success', async () => {
    const count = 10;
    let sendTxCalled = 0;
    cosmos.sendTransaction = async (reqType, epName, data, gasInfo) => {
      ++sendTxCalled;
      expect(reqType).equal('post');
      expect(epName).equal(`${APP_SERVICE}/count`);
      expect(validateCommonData(data)).equal(true);
      expect(gasInfo).equal(params.gasInfo);

      const str = `{"count": ${count}}`;
      return string2hex(str);
    };

    const res = await API.txCount(params.gasInfo);
    expect(sendTxCalled).equal(1);
    expect(res).equal(count);
  });

  it('txCount error', async () => {
    await txError('An error occurred', function () {
      return API.txCount(params.gasInfo);
    });
  });
});

describe('testing deleteAll', () => {
  saveCosmosFunctions();

  it('deleteAll success', async () => {
    let sendTxCalled = 0;
    cosmos.sendTransaction = async (reqType, epName, data, gasInfo) => {
      ++sendTxCalled;
      expect(reqType).equal('post');
      expect(epName).equal(`${APP_SERVICE}/deleteall`);
      expect(validateCommonData(data)).equal(true);
      expect(gasInfo).equal(params.gasInfo);
    };

    const res = await API.deleteAll(params.gasInfo);
    expect(sendTxCalled).equal(1);
    expect(typeof res).equal('undefined');
  });

  it('deleteAll error', async () => {
    await txError('An error occurred', function () {
      return API.deleteAll(params.gasInfo);
    });
  });
});

describe('testing keyValues', () => {
  saveCosmosFunctions();
  const kvs = {
    keyvalues: [
      { key: 'key1', value: 'value1' },
      { key: 'key2', value: 'value2' },
    ],
  };

  it('keyValues success', async () => {
    cosmos.query = async (ep) => {
      expect(ep).equal(`/crud/keyvalues/${params.address}`);

      return { result: kvs };
    };

    const res = await API.keyValues();
    expect(res).equal(kvs.keyvalues);
  });

  it('keyValues error', async () => {
    const msg = 'An error occurred';
    const url = `/crud/keyvalues/${params.address}`;

    await queryError(url, msg, function () {
      return API.keyValues();
    });
  });
});

describe('testing txKeyValues', () => {
  saveCosmosFunctions();

  it('txKeyValues success', async () => {
    const kvs =
      '{"keyvalues": [{"key": "key1", "value": "value1"}, {"key": "key2", "value": "value2"}]}';
    let sendTxCalled = 0;
    cosmos.sendTransaction = async (reqType, epName, data, gasInfo) => {
      ++sendTxCalled;
      expect(reqType).equal('post');
      expect(epName).equal(`${APP_SERVICE}/keyvalues`);
      expect(validateCommonData(data)).equal(true);
      expect(gasInfo).equal(params.gasInfo);

      return string2hex(kvs);
    };

    const res = await API.txKeyValues(params.gasInfo);
    expect(sendTxCalled).equal(1);
    expect(res).to.deep.equal(JSON.parse(kvs).keyvalues);
  });

  it('txKeyValues error', async () => {
    await txError('An error occurred', function () {
      return API.txKeyValues(params.gasInfo);
    });
  });
});

describe('testing mutliupdate', () => {
  const kvs = [
    { key: 'key1', value: 'value1' },
    { key: 'key2', value: 'value2' },
  ];
  saveCosmosFunctions();

  it('mutliupdate success', async () => {
    let sendTxCalled = 0;
    cosmos.sendTransaction = async (reqType, epName, data, gasInfo) => {
      ++sendTxCalled;
      expect(reqType).equal('post');
      expect(epName).equal(`${APP_SERVICE}/multiupdate`);
      expect(validateCommonData(data)).equal(true);
      expect(data.KeyValues).to.deep.equal(kvs);
      expect(gasInfo).equal(params.gasInfo);
    };

    const res = await API.multiUpdate(kvs, params.gasInfo);
    expect(sendTxCalled).equal(1);
    expect(typeof res).equal('undefined');
  });

  it('mutliupdate error', async () => {
    await txError('Key does not exist [0]', function () {
      return API.multiUpdate(kvs, params.gasInfo);
    });
  });
});

describe('testing getLease', () => {
  saveCosmosFunctions();

  it('getLease success', async () => {
    const key = 'key!@#$%^&*()_+';
    const lease = 100;

    cosmos.query = async (ep) => {
      const uri = API.encodeSafe(
        `${APP_SERVICE}/getlease/${params.address}/${key}`
      );
      expect(ep).equal(uri);
      return { result: { lease: lease } };
    };

    const res = await API.getLease(key);
    expect(res).equal(lease * BLOCK_TIME_IN_SECONDS);
  });

  it('getLease error', async () => {
    const key = 'key';
    const msg = 'key not found';
    const url = `${APP_SERVICE}/getlease/${params.address}/${key}`;

    await queryError(url, msg, function () {
      return API.getLease(key);
    });
  });
});

describe('testing txGetLease', () => {
  const key = 'key';
  const lease = 100;
  saveCosmosFunctions();

  it('txGetLease success', async () => {
    let sendTxCalled = 0;
    cosmos.sendTransaction = async (reqType, epName, data, gasInfo) => {
      ++sendTxCalled;
      expect(reqType).equal('post');
      expect(epName).equal(`${APP_SERVICE}/getlease`);
      expect(validateCommonData(data)).equal(true);
      expect(data.Key).equal(key);
      expect(gasInfo).equal(params.gasInfo);

      const str = `{"lease": "${lease}"}`;
      return string2hex(str);
    };

    const res = await API.txGetLease(key, params.gasInfo);
    expect(sendTxCalled).equal(1);
    expect(res).equal(lease * BLOCK_TIME_IN_SECONDS);
  });

  it('txGetLease error', async () => {
    await txError('key not found', function () {
      return API.txGetLease(key, params.gasInfo);
    });
  });
});

describe('testing renewLease', () => {
  const key = 'key';
  saveCosmosFunctions();

  it('renewLease success', async () => {
    let sendTxCalled = 0;
    cosmos.sendTransaction = async (reqType, epName, data, gasInfo) => {
      ++sendTxCalled;
      expect(reqType).equal('post');
      expect(epName).equal(`${APP_SERVICE}/renewlease`);
      expect(validateCommonData(data)).equal(true);
      expect(data.Key).equal(key);
      expect(data.Lease).equal(API.convertLease(params.lease_info));
      expect(gasInfo).equal(params.gasInfo);
    };

    const res = await API.renewLease(key, params.gasInfo, params.lease_info);
    expect(sendTxCalled).equal(1);
    expect(typeof res).equal('undefined');
  });

  it('renewLease error', async () => {
    await txError('key not found', function () {
      return API.renewLease(key, params.gasInfo, params.lease_info);
    });
  });
});

describe('testing renewLeaseAll', () => {
  saveCosmosFunctions();

  it('renewLeaseAll success', async () => {
    let sendTxCalled = 0;
    cosmos.sendTransaction = async (reqType, epName, data, gasInfo) => {
      ++sendTxCalled;
      expect(reqType).equal('post');
      expect(epName).equal(`${APP_SERVICE}/renewleaseall`);
      expect(validateCommonData(data)).equal(true);
      expect(data.Lease).equal(API.convertLease(params.lease_info));
      expect(gasInfo).equal(params.gasInfo);
    };

    const res = await API.renewLeaseAll(params.gasInfo, params.lease_info);
    expect(sendTxCalled).equal(1);
    expect(typeof res).equal('undefined');
  });

  it('renewLeaseAll error', async () => {
    await txError('key not found', function () {
      return API.renewLeaseAll(params.gasInfo, params.lease_info);
    });
  });
});

describe('testing getNShortestLease', () => {
  const n = 10;
  const leases = [
    { key: 'key1', lease: 100 },
    { key: 'key2', lease: 200 },
  ];
  saveCosmosFunctions();

  it('getNShortestLease success', async () => {
    cosmos.query = async (ep) => {
      expect(ep).equal(
        `${APP_SERVICE}/getnshortestlease/${params.address}/${n}`
      );

      return { result: { keyleases: leases } };
    };

    const res = await API.getNShortestLease(n);
    res.forEach(function (val, i, leaseInfo) {
      expect(leaseInfo[i].key).equal(leases[i].key);
      expect(leaseInfo[i].lease).equal(leases[i].lease * BLOCK_TIME_IN_SECONDS);
    });
  });

  it('getNShortestLease error', async () => {
    const msg = 'An error occurred';
    const url = `${APP_SERVICE}/getnshortestlease/${params.address}/${n}`;

    await queryError(url, msg, function () {
      return API.getNShortestLease(n);
    });
  });
});

describe('testing txGetNShortestLease', () => {
  saveCosmosFunctions();
  const n = 10;
  const leases = [
    { key: 'key1', lease: 100 },
    { key: 'key2', lease: 200 },
  ];

  it('txGetNShortestLease success', async () => {
    let sendTxCalled = 0;
    cosmos.sendTransaction = async (reqType, epName, data, gasInfo) => {
      ++sendTxCalled;
      expect(reqType).equal('post');
      expect(epName).equal(`${APP_SERVICE}/getnshortestlease`);
      expect(validateCommonData(data)).equal(true);
      expect(data.N).equal(n);
      expect(gasInfo).equal(params.gasInfo);

      const leaseInfo = JSON.stringify(leases);
      const str = `{"keyleases": ${leaseInfo}}`;
      return string2hex(str);
    };

    const res = await API.txGetNShortestLease(n, params.gasInfo);
    expect(sendTxCalled).equal(1);
    expect(typeof res).equal('object');
    expect(res.length).equal(leases.length);
    res.forEach(function (val, i, leaseInfo) {
      expect(leaseInfo[i].key).equal(leases[i].key);
      expect(leaseInfo[i].lease).equal(leases[i].lease * BLOCK_TIME_IN_SECONDS);
    });
  });

  it('txGetNShortestLease error', async () => {
    await txError('An error occurred', function () {
      return API.txGetNShortestLease(n, params.gasInfo);
    });
  });
});

describe('testing account', () => {
  saveCosmosFunctions();

  it('account success', async () => {
    const accountInfo = {
      value: {
        address: 'bluzelle1lgpau85z0hueyz6rraqqnskzmcz4zuzkfeqls7',
        coins: [{ denom: 'bnt', amount: '9899567400' }],
        public_key:
          'bluzellepub1addwnpepqd63w08dcrleyukxs4kq0n7ngalgyjdnu7jpf5khjmpykskyph2vypv6wms',
        account_number: 3,
        sequence: 218,
      },
    };

    cosmos.query = async (ep) => {
      expect(ep).equal(`auth/accounts/${params.address}`);

      return { result: accountInfo };
    };

    const res = await API.account();
    expect(res).to.deep.equal(accountInfo.value);
  });

  it('account error', async () => {
    const msg = 'An error occurred';
    const url = `auth/accounts/${params.address}`;

    await queryError(url, msg, function () {
      return API.account();
    });
  });
});

describe('testing version', () => {
  saveCosmosFunctions();

  it('version success', async () => {
    const versionInfo = {
      name: 'BluzelleService',
      server_name: 'blzd',
      client_name: 'blzcli',
      version: '0.0.0-39-g8895e3e',
      commit: '8895e3edf0a3ede0f6ed30f2224930e8faa1236e',
      build_tags: 'ledger,faucet,cosmos-sdk v0.38.1',
      go: 'go version go1.13.4 linux/amd64',
    };

    cosmos.query = async (ep) => {
      expect(ep).equal('node_info');

      return { application_version: versionInfo };
    };

    const res = await API.version();
    expect(res).equal(versionInfo.version);
  });

  it('version error', async () => {
    const msg = 'An error occurred';
    const url = 'node_info';

    await queryError(url, msg, function () {
      return API.version();
    });
  });
});
