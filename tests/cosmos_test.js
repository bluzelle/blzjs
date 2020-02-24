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
var assert = require('chai').assert;
var expect = require('chai').expect;
const cosmos = require('../src/swarmClient/cosmos.js');

const util = require('../src/swarmClient/util');
const ec = require ('elliptic').ec;
const bech32 = require ('bech32');
const bitcoinjs = require('bitcoinjs-lib');
const bip32 = require('bip32');
const bip39 = require('bip39');
const secp256k1 = new ec('secp256k1');

const gas_params = {'gas_price': '0.01'};

var app_endpoint = "http://localhost:1317";
const app_service = "/crud";
const tx_command = "txs";

const params =
{
    address: 'cosmos1zuxcvpkxlzf37dh4k95e2rujmy9sxqvxhaj5pn',
    mnemonic: 'desert maple evoke popular trumpet beach primary decline visit enhance dish drink excite setup public forward ladder girl end genre symbol alter category choose',
    endpoint: "http://localhost:1317",
    chain_id: "bluzelle",
    pub_key: "A7KDYwh5wY2Fp3zMpvkdS6Jz+pNtqE5MkN9J5fqLPdzD",
    priv_key: "",
    account_number: "0",
    sequence_number: "1"
};

// use the minimum needed data here so we catch future issues
const basic_response_data =
{
    "result": {
        "value": {
            "account_number": params.account_number,
            "sequence": params.sequence_number,
            "fee": {},
            "memo": ""
        }
    }
};

async function get_ec_private_key(mnemonic)
{
    const seed = await bip39.mnemonicToSeed(mnemonic);
    const node = await bip32.fromSeed(seed);
    const child = node.derivePath("m/44'/118'/0'/0/0");
    const ecpair = bitcoinjs.ECPair.fromPrivateKey(child.privateKey, {compressed: false});
    return ecpair.privateKey.toString('hex');
}

function verify_signature(data)
{
    let payload = {
        account_number: params.account_number,
        chain_id: params.chain_id,
        fee: util.sortJson(data.fee),
        memo: data.memo,
        msgs: util.sortJson(data.msg),
        sequence: params.sequence_number
    };

    // Calculate the SHA256 of the payload object
    let jsonHash = util.hash('sha256', Buffer.from(JSON.stringify(payload)));
    let sig = util.convertSignature(secp256k1.sign(jsonHash, params.priv_key, 'hex',
        {
            canonical: true,
        })).toString('base64');

    return sig === data.signatures[0].signature;
}

async function do_init()
{
    moxios.stubRequest(/\/auth\/accounts\/.*/,
        {
            status: 200,
            response: JSON.parse(JSON.stringify(basic_response_data))
        });

    return await cosmos.init(params.mnemonic, params.endpoint);
}

describe('testing initialize', () =>
{
    beforeEach(() =>
    {
        moxios.install(axios);
    });
    afterEach(() =>
    {
        moxios.uninstall(axios);
    });

    it('initializes fails on 500', async () =>
    {
        moxios.stubRequest(/\/auth\/accounts\/.*/,
            {
                status: 500,
                responseText: 'Server error'
            });

        const res = await cosmos.init(params.mnemonic, params.endpoint);
        expect(res).equal(false);
    });

    it('initialize success case', async () =>
    {
        const res = await do_init();
        expect(res).equal(true);
        expect(cosmos.account_info === basic_response_data.result);
    });

    it('initialize handles missing data', async () =>
    {
        const response_data =
            {
                "height": "81033",
                "result": {
                    "type": "cosmos-sdk/Account",
                    "value": {
                        "address": params.address,
                        "coins": [
                            {
                                "denom": "bnt",
                                "amount": "9899960000"
                            }
                        ],
                        "public_key": {
                            "type": "tendermint/PubKeySecp256k1",
                            "value": params.pub_key
                        }
                    }
                }
            };

        moxios.stubRequest(/\/auth\/accounts\/.*/,
            {
                status: 200,
                response: response_data
            });

        const res = await cosmos.init(params.mnemonic, params.endpoint);
        expect(res).equal(false);
    });

    it('initialize handles missing result', async () =>
    {
        const response_data =
            {
                "height": "81033"
            };

        moxios.stubRequest(/\/auth\/accounts\/.*/,
            {
                status: 200,
                response: response_data
            });

        const res = await cosmos.init(params.mnemonic, params.endpoint);
        expect(res).equal(false);
    });
});

describe('testing query', () =>
{
    beforeEach(() =>
    {
        moxios.install(axios);
    });
    afterEach(() =>
    {
        moxios.uninstall(axios);
    });

    it('basic query', async () =>
    {
        const res = await do_init();
        expect(res).equal(true);

        const response_data =
            {
                result: "this is a test"
            };

        moxios.stubRequest(/\/test/,
            {
                status: 200,
                response: response_data
            });

        const res2 = await cosmos.query(/test/);
        expect(res2).equal(response_data.result);
    });

    it('404 query', async () =>
    {
        const res = await do_init();
        expect(res).equal(true);

        const response = "not found";

        moxios.stubRequest(/\/test/,
            {
                status: 404,
                responseText: response
            });

        var response_text = '';

        // this should throw
        await cosmos.query(/test/).then(function (res)
        {
        }).catch(function (err)
        {
            response_text = err.message;
        });
        expect(response_text).equal(response);
    });

    it('key not found query', async () =>
    {
        const res = await do_init();
        expect(res).equal(true);

        const response =
            {
                error: '{"codespace":"sdk","code":6,"message":"could not read key"}'
            };

        moxios.stubRequest(/\/test/,
            {
                status: 404,
                response: response
            });

        var response_text = '';

        // this should throw
        await cosmos.query(/test/).then(function (res)
        {
        }).catch(function (err)
        {
            response_text = err.message;
        });
        expect(response_text).equal("could not read key");
    });
});

describe('testing send_transaction', () =>
{
    beforeEach(() =>
    {
        moxios.install(axios);
        params.sequence_number = "1";
    });
    afterEach(() =>
    {
        moxios.uninstall(axios);
    });

    const tx_create_skeleton =
        {
            "type": "cosmos-sdk/StdTx",
            "value": {
                "msg": [
                    {
                        "type": "crud/create",
                        "value": {
                            "UUID": "cosmos1zuxcvpkxlzf37dh4k95e2rujmy9sxqvxhaj5pn",
                            "Key": "mykey",
                            "Value": "##########",
                            "Owner": "cosmos1zuxcvpkxlzf37dh4k95e2rujmy9sxqvxhaj5pn"
                        }
                    }
                ],
                "fee": {
                    "amount": [],
                    "gas": "200000"
                },
                "signatures": null,
                "memo": ""
            }
        };

    const ep = "create";
    const method = "post";
    const WAIT_TIME = 100;
    const create_data = {
        BaseReq: {
            from: params.address,
            chain_id: params.chain_id
        },
        UUID: params.address,
        Key: "key",
        Value: "value",
        Owner: params.address
    };

    it('basic tx', async () =>
    {
        params.priv_key = await get_ec_private_key(params.mnemonic);

        // wait for account request
        const res2 = await do_init();
        expect(res2).equal(true);

        // first the library should send a create request to get the tx skeleton
        moxios.wait(function ()
        {
            let request = moxios.requests.mostRecent();
            expect(request.config.url).equal(app_endpoint + app_service + '/' + ep);
            expect(request.config.method).equal(method);
            expect(request.config.data).equal(JSON.stringify(create_data));

            // then it should sign and broadcast it
            moxios.wait(function ()
            {
                let request = moxios.requests.mostRecent();
                expect(request.config.method).equal('post');
                expect(request.config.url).equal(app_endpoint + '/txs');
                const data = JSON.parse(request.config.data);
                expect(data.tx.signatures.length).equal(1);
                expect(verify_signature(data.tx)).equal(true);

                // then it should poll for result
                moxios.wait(function ()
                {
                    let request = moxios.requests.mostRecent();
                    expect(request.config.method).equal('get');
                    expect(request.config.url).equal(app_endpoint + '/txs/xxxx');

                    request.respondWith({
                        status: 200,
                        response: {
                            logs: [{
                                success: true
                            }],
                            tx_hash: "xxxx"
                        }
                    });
                }, WAIT_TIME);

                request.respondWith({
                    status: 200,
                    response: {
                        logs: [{}],
                        txhash: "xxxx"
                    }
                });
            }, WAIT_TIME);

            request.respondWith({
                status: 200,
                response: tx_create_skeleton
            });
        }, WAIT_TIME);

        const prom = cosmos.send_transaction(method, ep, create_data);
        const res = await prom;
        expect(res.data.logs[0].success).equal(true);
    });

    it('two txs are synchronized', async () =>
    {
        params.priv_key = await get_ec_private_key(params.mnemonic);

        // wait for account request
        const r = await do_init();
        expect(r).equal(true);

        const error_response = '{"code": 1, "message": "key already exists"}';

        // first the library should send a create request to get the tx skeleton
        moxios.wait(function ()
        {
            let request = moxios.requests.mostRecent();
            expect(request.config.url).equal(app_endpoint + app_service + '/' + ep);
            expect(request.config.method).equal(method);
            expect(request.config.data).equal(JSON.stringify(create_data));

            // then it should sign and broadcast it
            moxios.wait(function ()
            {
                expect(moxios.requests.__items.length).equal(3);
                let request = moxios.requests.mostRecent();
                expect(request.config.method).equal('post');
                expect(request.config.url).equal(app_endpoint + '/txs');
                const data = JSON.parse(request.config.data);
                expect(data.tx.signatures.length).equal(1);
                expect(verify_signature(data.tx)).equal(true);

                // then it should poll for result and send second create request
                moxios.wait(function ()
                {
                    expect(moxios.requests.__items.length).equal(5);
                    for (var i = 3; i < 5; i++)
                    {
                        let request = moxios.requests.__items[i];
                        if (request.config.method === 'get')
                        {
                            expect(request.config.url).equal(app_endpoint + '/txs/xxxx');

                            request.respondWith({
                                status: 200,
                                response: {
                                    logs: [{
                                        success: true
                                    }],
                                    tx_hash: "xxxx"
                                }
                            });
                        }
                        else
                        {
                            expect(request.config.url).equal(app_endpoint + app_service + '/' + ep);
                            expect(request.config.method).equal(method);
                            expect(request.config.data).equal(JSON.stringify(create_data));

                            // then it should sign and broadcast it
                            moxios.wait(function ()
                            {
                                expect(moxios.requests.__items.length).equal(6);
                                let request = moxios.requests.mostRecent();
                                expect(request.config.method).equal('post');
                                expect(request.config.url).equal(app_endpoint + '/txs');
                                const data = JSON.parse(request.config.data);
                                expect(data.tx.signatures.length).equal(1);

                                // sequence should have been incremented
                                params.sequence_number = `${++params.sequence_number}`;
                                expect(verify_signature(data.tx)).equal(true);

                                // reject with error
                                request.respondWith({
                                    status: 200,
                                    response: {
                                        raw_log: error_response
                                    }
                                });
                            });

                            // second create skeleton
                            request.respondWith({
                                status: 200,
                                response: tx_create_skeleton
                            });
                        }
                    }
                }, WAIT_TIME);

                request.respondWith({
                    status: 200,
                    response: {
                        logs: [{}],
                        txhash: "xxxx"
                    }
                });
            }, WAIT_TIME);

            request.respondWith({
                status: 200,
                response: tx_create_skeleton
            });
        }, WAIT_TIME);

        var error = false;
        var prom = cosmos.send_transaction(method, ep, create_data);
        var prom2 = cosmos.send_transaction(method, ep, create_data);

        const res = await prom;
        expect(res.data.logs[0].success).equal(true);

        try
        {
            const res2 = await prom2;
        }
        catch (e)
        {
            expect(e).equal(error_response);
            error = true;
        }

        expect(error).equal(true);
    });

    it('500 failure', async () =>
    {
        params.priv_key = await get_ec_private_key(params.mnemonic);

        // wait for account request
        const r = await do_init();
        expect(r).equal(true);

        // first the library should send a create request to get the tx skeleton
        moxios.wait(function ()
        {
            let request = moxios.requests.mostRecent();
            expect(request.config.url).equal(app_endpoint + app_service + '/' + ep);
            expect(request.config.method).equal(method);
            expect(request.config.data).equal(JSON.stringify(create_data));

            request.respondWith({
                status: 500,
                responseText: "Server error"
            });
        }, WAIT_TIME);

        var error = false;

        try
        {
            var res = await cosmos.send_transaction(method, ep, create_data);
        }
        catch(e)
        {
            expect(e).equal("Request failed with status code 500");
            error = true;
        }

        expect(error).equal(true);
    });

    it('continues after broadcast failure', async () =>
    {
        params.priv_key = await get_ec_private_key(params.mnemonic);

        // wait for account request
        const r = await do_init();
        expect(r).equal(true);

        // first the library should send a create request to get the tx skeleton
        moxios.wait(function ()
        {
            let request = moxios.requests.mostRecent();
            expect(request.config.url).equal(app_endpoint + app_service + '/' + ep);
            expect(request.config.method).equal(method);
            expect(request.config.data).equal(JSON.stringify(create_data));

            // then it should sign and broadcast it
            moxios.wait(function ()
            {
                let request = moxios.requests.mostRecent();
                expect(request.config.method).equal('post');
                expect(request.config.url).equal(app_endpoint + '/txs');
                const data = JSON.parse(request.config.data);
                expect(data.tx.signatures.length).equal(1);
                expect(verify_signature(data.tx)).equal(true);

                request.respondWith({
                    status: 404,
                    responseText: "Not found"
                });
            }, WAIT_TIME);

            request.respondWith({
                status: 200,
                response: tx_create_skeleton
            });
        }, WAIT_TIME);

        var error = false;

        try
        {
            var res = await cosmos.send_transaction(method, ep, create_data);
        }
        catch(e)
        {
            expect(e).equal("Request failed with status code 404");
            error = true;
        }

        expect(error).equal(true);

        // the code should send a full new request (including broadcast_tx) after suffering a failure
        moxios.wait(function ()
        {
            let request = moxios.requests.mostRecent();
            expect(request.config.url).equal(app_endpoint + app_service + '/' + ep);
            expect(request.config.method).equal(method);
            expect(request.config.data).equal(JSON.stringify(create_data));

            // then it should sign and broadcast it
            moxios.wait(function ()
            {
                let request = moxios.requests.mostRecent();
                expect(request.config.method).equal('post');
                expect(request.config.url).equal(app_endpoint + '/txs');
                const data = JSON.parse(request.config.data);
                expect(data.tx.signatures.length).equal(1);

                // the sequence number should NOT have incremented
                expect(verify_signature(data.tx)).equal(true);

                // then it should poll for result
                moxios.wait(function ()
                {
                    let request = moxios.requests.mostRecent();
                    expect(request.config.method).equal('get');
                    expect(request.config.url).equal(app_endpoint + '/txs/xxxx');

                    request.respondWith({
                        status: 200,
                        response: {
                            logs: [{
                                success: true
                            }],
                            tx_hash: "xxxx"
                        }
                    });
                }, WAIT_TIME);

                request.respondWith({
                    status: 200,
                    response: {
                        logs: [{}],
                        txhash: "xxxx"
                    }
                });
            }, WAIT_TIME);

            request.respondWith({
                status: 200,
                response: tx_create_skeleton
            });
        }, WAIT_TIME);

        const prom = cosmos.send_transaction(method, ep, create_data);
        const res2 = await prom;
        expect(res2.data.logs[0].success).equal(true);
    });
});
