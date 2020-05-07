
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
var expect = require('chai').expect;
const cosmos = require('../client/lib/swarmClient/cosmos.js');

const util = require('../client/lib/swarmClient/util');
const ec = require ('elliptic').ec;
//const bech32 = require ('bech32');
const bitcoinjs = require('bitcoinjs-lib');
const bip32 = require('bip32');
const bip39 = require('bip39');
const secp256k1 = new ec('secp256k1');

const gas_params = {'gas_price': '0.01', 'max_gas': '20000'};

var app_endpoint = "http://localhost:1317";
const tx_command = "txs";

const params =
{
    address: 'bluzelle1lgpau85z0hueyz6rraqqnskzmcz4zuzkfeqls7',
    mnemonic: 'panic cable humor almost reveal artist govern sample segment effort today start cotton canoe icon panel rain donkey brown swift suit extra sick valve',
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

const ep = "crud/create";
const method = "post";
const WAIT_TIME = 100;
const RETRY_WAIT_TIME = cosmos.RETRY_INTERVAL + WAIT_TIME;

const create_data = {
    BaseReq: {
        from: params.address,
        chain_id: params.chain_id
    },
    UUID: params.address,
    Key: "key!@#$%^<>",
    Value: "value&*()_+",
    Owner: params.address
};

const tx_create_skeleton =
    {
        "type": "cosmos-sdk/StdTx",
        "value": {
            "msg": [
                {
                    "type": "crud/create",
                    "value": {
                        "UUID": params.address,
                        "Key": create_data.Key,
                        "Value": create_data.Value,
                        "Owner": params.address
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
    let jsonHash = util.hash('sha256', Buffer.from(cosmos.sanitize_string(JSON.stringify(payload))));
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

    await cosmos.init(params.mnemonic, params.endpoint, params.address);
    moxios.stubs.reset();
}

async function do_init_fail()
{
    let error = false;
    try
    {
        await cosmos.init(params.mnemonic, params.endpoint, params.address);
    }
    catch (err)
    {
        error = true;
    }

    return error;
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

    it.skip('initializes fails on 500', async () =>
    {
        moxios.stubRequest(/\/auth\/accounts\/.*/,
            {
                status: 500,
                responseText: 'Server error'
            });

        expect(await do_init_fail()).equal(true);
    });

    it.skip('initialize success case', async () =>
    {
        const res = await do_init();
        expect(cosmos.account_info === basic_response_data.result);
    });


    it.skip('initialize handles zero account sequence', async () =>
    {
        response = {
            status: 200,
            response: JSON.parse(JSON.stringify(basic_response_data))
        };
        response.response.result.value.sequence = "0";

        moxios.stubRequest(/\/auth\/accounts\/.*/, response);

        await cosmos.init(params.mnemonic, params.endpoint, params.address);
        moxios.stubs.reset();

    });

    it.skip('initialize handles missing data', async () =>
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

        expect(await do_init_fail()).equal(true);
    });

    it.skip('initialize handles missing result', async () =>
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

        expect(await do_init_fail()).equal(true);
    });

    it('detects bad address', async () =>
    {
        let error = false;
        try
        {
            await cosmos.init(params.mnemonic, params.endpoint, params.address + 'x');
        }
        catch (err)
        {
            expect(err.message.search("Bad credentials")).equal(0);
            error = true;
        }

        expect(error).equal(true);
    });

    it('detects bad mnemonic', async () =>
    {
        let error = false;
        try
        {
            await cosmos.init(params.mnemonic + 'x', params.endpoint, params.address);
        }
        catch (err)
        {
            expect(err.message.search("Bad credentials")).equal(0);
            error = true;
        }

        expect(error).equal(true);
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

    it.skip('basic query', async () =>
    {
        await do_init();

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
        expect(res2).equal(response_data);
    });

    it.skip('404 query', async () =>
    {
        await do_init();

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

    it.skip('key not found query', async () =>
    {
        await do_init();

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

function do_create()
{
    // first the library should send a create request to get the tx skeleton
    moxios.wait(function ()
    {
        let request = moxios.requests.mostRecent();
        expect(request.config.url).equal(app_endpoint + '/' + ep);
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
                status: 200,
                response: {
                    raw_log: [],
                    txhash: "xxxx"
                }
            });
        }, WAIT_TIME);

        request.respondWith({
            status: 200,
            response: tx_create_skeleton
        });
    }, WAIT_TIME);
}

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

    it.skip('basic tx', async () =>
    {
        params.priv_key = await get_ec_private_key(params.mnemonic);

        // wait for account request
        await do_init();

        do_create();

        const prom = cosmos.send_transaction(method, ep, create_data, gas_params);
        const res = await prom;
    });

    it.skip('two txs are synchronized', async () =>
    {
        params.priv_key = await get_ec_private_key(params.mnemonic);

        // wait for account request
        await do_init();

        const error_response = {"code": 1, "raw_log": "unauthorized: Key already exists: failed to execute message; message index: 0"};
        const error_message = 'Key already exists';

        // first the library should send a create request to get the tx skeleton
        moxios.wait(function ()
        {
            let request = moxios.requests.mostRecent();
            expect(request.config.url).equal(app_endpoint + '/' + ep);
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
                    expect(moxios.requests.__items.length).equal(4);
                    let request = moxios.requests.__items[3];
                    expect(request.config.url).equal(app_endpoint + '/' + ep);
                    expect(request.config.method).equal(method);
                    expect(request.config.data).equal(JSON.stringify(create_data));

                    // then it should sign and broadcast it
                    moxios.wait(function ()
                    {
                        expect(moxios.requests.__items.length).equal(5);
                        let request = moxios.requests.mostRecent();
                        expect(request.config.method).equal('post');
                        expect(request.config.url).equal(app_endpoint + '/txs');
                        const data = JSON.parse(request.config.data);
                        expect(data.tx.signatures.length).equal(1);

                        // sequence should have been incremented
                        params.sequence_number = `${++params.sequence_number}`;
                        expect(verify_signature(data.tx)).equal(true);

                        // response for second tx
                        request.respondWith({
                            status: 200,
                            response: error_response
                        });
                    });

                    // second create skeleton
                    request.respondWith({
                        status: 200,
                        response: tx_create_skeleton
                    });
                }, WAIT_TIME);

                // response for first tx
                request.respondWith({
                    status: 200,
                    response: {
                        raw_log: [],
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

        try
        {
            const res2 = await prom2;
        }
        catch (e)
        {
            expect(e.message).equal(error_message);
            error = true;
        }

        expect(error).equal(true);
    });

    it.skip('500 failure', async () =>
    {
        params.priv_key = await get_ec_private_key(params.mnemonic);

        // wait for account request
        await do_init();

        // first the library should send a create request to get the tx skeleton
        moxios.wait(function ()
        {
            let request = moxios.requests.mostRecent();
            expect(request.config.url).equal(app_endpoint + '/' + ep);
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
            expect(e.message).equal("Request failed with status code 500");
            error = true;
        }

        expect(error).equal(true);
    });

    it.skip('continues after broadcast failure', async () =>
    {
        params.priv_key = await get_ec_private_key(params.mnemonic);

        // wait for account request
        await do_init();

        // first the library should send a create request to get the tx skeleton
        moxios.wait(function ()
        {
            let request = moxios.requests.mostRecent();
            expect(request.config.url).equal(app_endpoint + '/' + ep);
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
            expect(e.message).equal("Request failed with status code 404");
            error = true;
        }

        expect(error).equal(true);

        // the code should send a full new request (including broadcast_tx) after suffering a failure
        moxios.wait(function ()
        {
            let request = moxios.requests.mostRecent();
            expect(request.config.url).equal(app_endpoint + '/' + ep);
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
    });

    it.skip('handles sequence race', async () =>
    {
        params.priv_key = await get_ec_private_key(params.mnemonic);

        // wait for account request
        await do_init();

        // first the library should send a create request to get the tx skeleton
        moxios.wait(function ()
        {
            let request = moxios.requests.mostRecent();
            expect(request.config.url).equal(app_endpoint + '/' + ep);
            expect(request.config.method).equal(method);
            expect(request.config.data).equal(JSON.stringify(create_data));

            // then it should sign and broadcast it
            moxios.wait(function ()
            {
                let request = moxios.requests.mostRecent();
                expect(request.config.method).equal('post');
                expect(request.config.url).equal(app_endpoint + '/txs');

                // should request updated account info - reply with updated sequence
                moxios.wait(function ()
                {
                    let request = moxios.requests.mostRecent();
                    expect(request.config.method).equal('get');
                    //expect(request.config.url).equal(app_endpoint + '/auth/accounts/xxxx');

                    // now it should re-send tx with new sequence number
                    params.sequence_number = `${++params.sequence_number}`;
                    do_create();

                    // respond with updated sequence number
                    let response = JSON.parse(JSON.stringify(basic_response_data));
                    response.result.value.sequence = `${++response.result.value.sequence}`;
                    request.respondWith({
                        status: 200,
                        response: response
                    });
                }, RETRY_WAIT_TIME);

                // simulate a signature failure
                request.respondWith({
                    status: 200,
                    response: {
                        code: 4,
                        raw_log: 'signature verification failed'
                    }});
            }, WAIT_TIME);

            request.respondWith({
                status: 200,
                response: tx_create_skeleton
            });
        }, WAIT_TIME);

        const prom = cosmos.send_transaction(method, ep, create_data, gas_params);
        const res = await prom;
    });

    function respond_with_same_sequence(count)
    {
        if (count)
        {
            // should request updated account info - reply with same sequence
            moxios.wait(function ()
            {
                let request = moxios.requests.mostRecent();
                expect(request.config.method).equal('get');

                // respond with NOT updated sequence number
                let response = JSON.parse(JSON.stringify(basic_response_data));
                request.respondWith({
                    status: 200,
                    response: response
                });

                respond_with_same_sequence(count - 1);

            }, RETRY_WAIT_TIME);
        }
    }

    it.skip('detects bad chain_id', async () =>
    {
        params.priv_key = await get_ec_private_key(params.mnemonic);

        // wait for account request
        await do_init();

        // first the library should send a create request to get the tx skeleton
        moxios.wait(function ()
        {
            let request = moxios.requests.mostRecent();
            expect(request.config.url).equal(app_endpoint + '/' + ep);
            expect(request.config.method).equal(method);
            expect(request.config.data).equal(JSON.stringify(create_data));

            // then it should sign and broadcast it
            moxios.wait(function ()
            {
                let request = moxios.requests.mostRecent();
                expect(request.config.method).equal('post');
                expect(request.config.url).equal(app_endpoint + '/txs');

                // expect 10 retries to get sequence number
                respond_with_same_sequence(cosmos.MAX_RETRIES);

                // simulate a signature failure
                request.respondWith({
                    status: 200,
                    response: {
                        code: 4,
                        raw_log: 'signature verification failed'
                    }});
            }, WAIT_TIME);

            request.respondWith({
                status: 200,
                response: tx_create_skeleton
            });
        }, WAIT_TIME);

        var error = "";
        try
        {
            await cosmos.send_transaction(method, ep, create_data, gas_params);
        }
        catch (err)
        {
            error = err.message;
        }

        expect(error).equal("Invalid chain id");
    });
});
