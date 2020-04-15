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

const axios = require('axios');
const moxios = require('moxios');
const expect = require('chai').expect;
const cosmos = require('../src/swarmClient/cosmos.js');

const util = require('../src/swarmClient/util');
const Ec = require('elliptic').ec;
const bitcoinjs = require('bitcoinjs-lib');
const bip32 = require('bip32');
const bip39 = require('bip39');
const secp256k1 = new Ec('secp256k1');

const GAS_PARAMS = { gas_price: '0.01', max_gas: '20000' };
const APP_ENDPOINT = 'http://localhost:1317';

const params = {
  address: 'bluzelle1lgpau85z0hueyz6rraqqnskzmcz4zuzkfeqls7',
  mnemonic:
    'panic cable humor almost reveal artist govern sample segment effort today start cotton canoe icon panel rain donkey brown swift suit extra sick valve', // eslint-disable-line max-len
  endpoint: 'http://localhost:1317',
  chain_id: 'bluzelle',
  pub_key: 'A7KDYwh5wY2Fp3zMpvkdS6Jz+pNtqE5MkN9J5fqLPdzD',
  priv_key: '',
  account_number: '0',
  sequence_number: '1',
};

// use the minimum needed data here so we catch future issues
const BASIC_RESPONSE_DATA = {
  result: {
    value: {
      account_number: params.account_number,
      sequence: params.sequence_number,
      fee: {},
      memo: '',
    },
  },
};

const ep = 'crud/create';
const method = 'post';
const WAIT_TIME = 100;
const RETRY_WAIT_TIME = cosmos.RETRY_INTERVAL + WAIT_TIME;

const CREATE_DATA = {
  BaseReq: {
    from: params.address,
    chain_id: params.chain_id,
  },
  UUID: params.address,
  Key: 'key!@#$%^<>',
  Value: 'value&*()_+',
  Owner: params.address,
};

const TX_CREATE_SKELETON = {
  type: 'cosmos-sdk/StdTx',
  value: {
    msg: [
      {
        type: 'crud/create',
        value: {
          UUID: params.address,
          Key: CREATE_DATA.Key,
          Value: CREATE_DATA.Value,
          Owner: params.address,
        },
      },
    ],
    fee: {
      amount: [],
      gas: '200000',
    },
    signatures: null,
    memo: '',
  },
};

async function getECPrivateKey(mnemonic) {
  const seed = await bip39.mnemonicToSeed(mnemonic);
  const node = await bip32.fromSeed(seed);
  const child = node.derivePath("m/44'/118'/0'/0/0"); // eslint-disable-line quotes
  const ecpair = bitcoinjs.ECPair.fromPrivateKey(child.privateKey, {
    compressed: false,
  });
  return ecpair.privateKey.toString('hex');
}

function verifySignature(data) {
  const payload = {
    account_number: params.account_number,
    chain_id: params.chain_id,
    fee: util.sortJson(data.fee),
    memo: data.memo,
    msgs: util.sortJson(data.msg),
    sequence: params.sequence_number,
  };

  // Calculate the SHA256 of the payload object
  const jsonHash = util.hash(
    'sha256',
    Buffer.from(cosmos.sanitizeString(JSON.stringify(payload)))
  );
  const sig = util
    .convertSignature(
      secp256k1.sign(jsonHash, params.priv_key, 'hex', {
        canonical: true,
      })
    )
    .toString('base64');

  return sig === data.signatures[0].signature;
}

async function doInit() {
  moxios.stubRequest(/\/auth\/accounts\/.*/, {
    status: 200,
    response: JSON.parse(JSON.stringify(BASIC_RESPONSE_DATA)),
  });

  await cosmos.init(params.mnemonic, params.endpoint, params.address);
  moxios.stubs.reset();
}

async function doInitFail() {
  let error = false;
  try {
    await cosmos.init(params.mnemonic, params.endpoint, params.address);
  } catch (err) {
    error = true;
  }

  return error;
}

describe('testing initialize', () => {
  beforeEach(() => {
    moxios.install(axios);
  });
  afterEach(() => {
    moxios.uninstall(axios);
  });

  it('initializes fails on 500', async () => {
    moxios.stubRequest(/\/auth\/accounts\/.*/, {
      status: 500,
      responseText: 'Server error',
    });

    expect(await doInitFail()).equal(true);
  });

  it('initialize success case', async () => {
    await doInit();
    expect(cosmos.account_info === BASIC_RESPONSE_DATA.result);
  });

  it('initialize handles missing data', async () => {
    const responseData = {
      height: '81033',
      result: {
        type: 'cosmos-sdk/Account',
        value: {
          address: params.address,
          coins: [
            {
              denom: 'bnt',
              amount: '9899960000',
            },
          ],
          public_key: {
            type: 'tendermint/PubKeySecp256k1',
            value: params.pub_key,
          },
        },
      },
    };

    moxios.stubRequest(/\/auth\/accounts\/.*/, {
      status: 200,
      response: responseData,
    });

    expect(await doInitFail()).equal(true);
  });

  it('initialize handles missing result', async () => {
    const responseData = {
      height: '81033',
    };

    moxios.stubRequest(/\/auth\/accounts\/.*/, {
      status: 200,
      response: responseData,
    });

    expect(await doInitFail()).equal(true);
  });

  it('detects bad address', async () => {
    let error = false;
    try {
      await cosmos.init(params.mnemonic, params.endpoint, params.address + 'x');
    } catch (err) {
      expect(err.message.search('Bad credentials')).equal(0);
      error = true;
    }

    expect(error).equal(true);
  });

  it('detects bad mnemonic', async () => {
    let error = false;
    try {
      await cosmos.init(params.mnemonic + 'x', params.endpoint, params.address);
    } catch (err) {
      expect(err.message.search('Bad credentials')).equal(0);
      error = true;
    }

    expect(error).equal(true);
  });
});

describe('testing query', () => {
  beforeEach(() => {
    moxios.install(axios);
  });
  afterEach(() => {
    moxios.uninstall(axios);
  });

  it('basic query', async () => {
    await doInit();

    const responseData = {
      result: 'this is a test',
    };

    moxios.stubRequest(/\/test/, {
      status: 200,
      response: responseData,
    });

    const res2 = await cosmos.query(/test/);
    expect(res2).equal(responseData);
  });

  it('404 query', async () => {
    await doInit();

    const response = 'not found';

    moxios.stubRequest(/\/test/, {
      status: 404,
      responseText: response,
    });

    let responseText = '';

    // this should throw
    await cosmos
      .query(/test/)
      .then(function (res) {})
      .catch(function (err) {
        responseText = err.message;
      });
    expect(responseText).equal(response);
  });

  it('key not found query', async () => {
    await doInit();

    const response = {
      error: '{"codespace":"sdk","code":6,"message":"could not read key"}',
    };

    moxios.stubRequest(/\/test/, {
      status: 404,
      response: response,
    });

    let responseText = '';

    // this should throw
    await cosmos
      .query(/test/)
      .then(function (res) {})
      .catch(function (err) {
        responseText = err.message;
      });
    expect(responseText).equal('could not read key');
  });
});

function doCreate() {
  // first the library should send a create request to get the tx skeleton
  moxios.wait(function () {
    const request = moxios.requests.mostRecent();
    expect(request.config.url).equal(APP_ENDPOINT + '/' + ep);
    expect(request.config.method).equal(method);
    expect(request.config.data).equal(JSON.stringify(CREATE_DATA));

    // then it should sign and broadcast it
    moxios.wait(function () {
      const request = moxios.requests.mostRecent();
      expect(request.config.method).equal('post');
      expect(request.config.url).equal(APP_ENDPOINT + '/txs');
      const data = JSON.parse(request.config.data);
      expect(data.tx.signatures.length).equal(1);
      expect(verifySignature(data.tx)).equal(true);

      request.respondWith({
        status: 200,
        response: {
          raw_log: [],
          txhash: 'xxxx',
        },
      });
    }, WAIT_TIME);

    request.respondWith({
      status: 200,
      response: TX_CREATE_SKELETON,
    });
  }, WAIT_TIME);
}

describe('testing sendTransaction', () => {
  beforeEach(() => {
    moxios.install(axios);
    params.sequence_number = '1';
  });
  afterEach(() => {
    moxios.uninstall(axios);
  });

  it('basic tx', async () => {
    params.priv_key = await getECPrivateKey(params.mnemonic);

    // wait for account request
    await doInit();

    doCreate();

    const prom = cosmos.sendTransaction(method, ep, CREATE_DATA, GAS_PARAMS);
    await prom;
  });

  it('two txs are synchronized', async () => {
    params.priv_key = await getECPrivateKey(params.mnemonic);

    // wait for account request
    await doInit();

    const errorResponse = {
      code: 1,
      raw_log:
        'unauthorized: Key already exists: failed to execute message; message index: 0',
    };
    const errorMessage = 'Key already exists';

    // first the library should send a create request to get the tx skeleton
    moxios.wait(function () {
      const request = moxios.requests.mostRecent();
      expect(request.config.url).equal(APP_ENDPOINT + '/' + ep);
      expect(request.config.method).equal(method);
      expect(request.config.data).equal(JSON.stringify(CREATE_DATA));

      // then it should sign and broadcast it
      moxios.wait(function () {
        expect(moxios.requests.__items.length).equal(3);
        const request = moxios.requests.mostRecent();
        expect(request.config.method).equal('post');
        expect(request.config.url).equal(APP_ENDPOINT + '/txs');
        const data = JSON.parse(request.config.data);
        expect(data.tx.signatures.length).equal(1);
        expect(verifySignature(data.tx)).equal(true);

        // then it should poll for result and send second create request
        moxios.wait(function () {
          expect(moxios.requests.__items.length).equal(4);
          const request = moxios.requests.__items[3];
          expect(request.config.url).equal(APP_ENDPOINT + '/' + ep);
          expect(request.config.method).equal(method);
          expect(request.config.data).equal(JSON.stringify(CREATE_DATA));

          // then it should sign and broadcast it
          moxios.wait(function () {
            expect(moxios.requests.__items.length).equal(5);
            const request = moxios.requests.mostRecent();
            expect(request.config.method).equal('post');
            expect(request.config.url).equal(APP_ENDPOINT + '/txs');
            const data = JSON.parse(request.config.data);
            expect(data.tx.signatures.length).equal(1);

            // sequence should have been incremented
            params.sequence_number = `${++params.sequence_number}`;
            expect(verifySignature(data.tx)).equal(true);

            // response for second tx
            request.respondWith({
              status: 200,
              response: errorResponse,
            });
          });

          // second create skeleton
          request.respondWith({
            status: 200,
            response: TX_CREATE_SKELETON,
          });
        }, WAIT_TIME);

        // response for first tx
        request.respondWith({
          status: 200,
          response: {
            raw_log: [],
            txhash: 'xxxx',
          },
        });
      }, WAIT_TIME);

      request.respondWith({
        status: 200,
        response: TX_CREATE_SKELETON,
      });
    }, WAIT_TIME);

    let error = false;
    const prom = cosmos.sendTransaction(method, ep, CREATE_DATA);
    const prom2 = cosmos.sendTransaction(method, ep, CREATE_DATA);

    await prom;

    try {
      await prom2;
    } catch (e) {
      expect(e.message).equal(errorMessage);
      error = true;
    }

    expect(error).equal(true);
  });

  it('500 failure', async () => {
    params.priv_key = await getECPrivateKey(params.mnemonic);

    // wait for account request
    await doInit();

    // first the library should send a create request to get the tx skeleton
    moxios.wait(function () {
      const request = moxios.requests.mostRecent();
      expect(request.config.url).equal(APP_ENDPOINT + '/' + ep);
      expect(request.config.method).equal(method);
      expect(request.config.data).equal(JSON.stringify(CREATE_DATA));

      request.respondWith({
        status: 500,
        responseText: 'Server error',
      });
    }, WAIT_TIME);

    let error = false;

    try {
      await cosmos.sendTransaction(method, ep, CREATE_DATA);
    } catch (e) {
      expect(e.message).equal('Request failed with status code 500');
      error = true;
    }

    expect(error).equal(true);
  });

  it('continues after broadcast failure', async () => {
    params.priv_key = await getECPrivateKey(params.mnemonic);

    // wait for account request
    await doInit();

    // first the library should send a create request to get the tx skeleton
    moxios.wait(function () {
      const request = moxios.requests.mostRecent();
      expect(request.config.url).equal(APP_ENDPOINT + '/' + ep);
      expect(request.config.method).equal(method);
      expect(request.config.data).equal(JSON.stringify(CREATE_DATA));

      // then it should sign and broadcast it
      moxios.wait(function () {
        const request = moxios.requests.mostRecent();
        expect(request.config.method).equal('post');
        expect(request.config.url).equal(APP_ENDPOINT + '/txs');
        const data = JSON.parse(request.config.data);
        expect(data.tx.signatures.length).equal(1);
        expect(verifySignature(data.tx)).equal(true);

        request.respondWith({
          status: 404,
          responseText: 'Not found',
        });
      }, WAIT_TIME);

      request.respondWith({
        status: 200,
        response: TX_CREATE_SKELETON,
      });
    }, WAIT_TIME);

    let error = false;

    try {
      await cosmos.sendTransaction(method, ep, CREATE_DATA);
    } catch (e) {
      expect(e.message).equal('Request failed with status code 404');
      error = true;
    }

    expect(error).equal(true);

    // the code should send a full new request (including broadcast_tx) after suffering a failure
    moxios.wait(function () {
      const request = moxios.requests.mostRecent();
      expect(request.config.url).equal(APP_ENDPOINT + '/' + ep);
      expect(request.config.method).equal(method);
      expect(request.config.data).equal(JSON.stringify(CREATE_DATA));

      // then it should sign and broadcast it
      moxios.wait(function () {
        const request = moxios.requests.mostRecent();
        expect(request.config.method).equal('post');
        expect(request.config.url).equal(APP_ENDPOINT + '/txs');
        const data = JSON.parse(request.config.data);
        expect(data.tx.signatures.length).equal(1);

        // the sequence number should NOT have incremented
        expect(verifySignature(data.tx)).equal(true);

        request.respondWith({
          status: 200,
          response: {
            logs: [{}],
            txhash: 'xxxx',
          },
        });
      }, WAIT_TIME);

      request.respondWith({
        status: 200,
        response: TX_CREATE_SKELETON,
      });
    }, WAIT_TIME);

    const prom = cosmos.sendTransaction(method, ep, CREATE_DATA);
    await prom;
  });

  it('handles sequence race', async () => {
    params.priv_key = await getECPrivateKey(params.mnemonic);

    // wait for account request
    await doInit();

    // first the library should send a create request to get the tx skeleton
    moxios.wait(function () {
      const request = moxios.requests.mostRecent();
      expect(request.config.url).equal(APP_ENDPOINT + '/' + ep);
      expect(request.config.method).equal(method);
      expect(request.config.data).equal(JSON.stringify(CREATE_DATA));

      // then it should sign and broadcast it
      moxios.wait(function () {
        const request = moxios.requests.mostRecent();
        expect(request.config.method).equal('post');
        expect(request.config.url).equal(APP_ENDPOINT + '/txs');

        // should request updated account info - reply with updated sequence
        moxios.wait(function () {
          const request = moxios.requests.mostRecent();
          expect(request.config.method).equal('get');
          // expect(request.config.url).equal(APP_ENDPOINT + '/auth/accounts/xxxx');

          // now it should re-send tx with new sequence number
          params.sequence_number = `${++params.sequence_number}`;
          doCreate();

          // respond with updated sequence number
          const response = JSON.parse(JSON.stringify(BASIC_RESPONSE_DATA));
          response.result.value.sequence = `${++response.result.value
            .sequence}`;
          request.respondWith({
            status: 200,
            response: response,
          });
        }, RETRY_WAIT_TIME);

        // simulate a signature failure
        request.respondWith({
          status: 200,
          response: {
            code: 4,
            raw_log: 'signature verification failed',
          },
        });
      }, WAIT_TIME);

      request.respondWith({
        status: 200,
        response: TX_CREATE_SKELETON,
      });
    }, WAIT_TIME);

    const prom = cosmos.sendTransaction(method, ep, CREATE_DATA, GAS_PARAMS);
    await prom;
  });

  function respondWithSameSequence(count) {
    if (count) {
      // should request updated account info - reply with same sequence
      moxios.wait(function () {
        const request = moxios.requests.mostRecent();
        expect(request.config.method).equal('get');

        // respond with NOT updated sequence number
        const response = JSON.parse(JSON.stringify(BASIC_RESPONSE_DATA));
        request.respondWith({
          status: 200,
          response: response,
        });

        respondWithSameSequence(count - 1);
      }, RETRY_WAIT_TIME);
    }
  }

  it('detects bad chain_id', async () => {
    params.priv_key = await getECPrivateKey(params.mnemonic);

    // wait for account request
    await doInit();

    // first the library should send a create request to get the tx skeleton
    moxios.wait(function () {
      const request = moxios.requests.mostRecent();
      expect(request.config.url).equal(APP_ENDPOINT + '/' + ep);
      expect(request.config.method).equal(method);
      expect(request.config.data).equal(JSON.stringify(CREATE_DATA));

      // then it should sign and broadcast it
      moxios.wait(function () {
        const request = moxios.requests.mostRecent();
        expect(request.config.method).equal('post');
        expect(request.config.url).equal(APP_ENDPOINT + '/txs');

        // expect 10 retries to get sequence number
        respondWithSameSequence(cosmos.MAX_RETRIES);

        // simulate a signature failure
        request.respondWith({
          status: 200,
          response: {
            code: 4,
            raw_log: 'signature verification failed',
          },
        });
      }, WAIT_TIME);

      request.respondWith({
        status: 200,
        response: TX_CREATE_SKELETON,
      });
    }, WAIT_TIME);

    let error = '';
    try {
      await cosmos.sendTransaction(method, ep, CREATE_DATA, GAS_PARAMS);
    } catch (err) {
      error = err.message;
    }

    expect(error).equal('Invalid chain id');
  });
});
