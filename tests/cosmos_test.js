#!/usr/bin/node

const axios = require('axios');
const moxios = require('moxios');
var assert = require('chai').assert;
var expect = require('chai').expect;
const cosmos = require('../src/swarmClient/cosmos.js');

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
    pub_key: "A7KDYwh5wY2Fp3zMpvkdS6Jz+pNtqE5MkN9J5fqLPdzD"
};

// use the minimum needed data here so we catch future issues
const basic_response_data =
    {
        "result": {
            "value": {
                "account_number": "0",
                "sequence": "1"
            }
        }
    };


async function do_init()
{
    moxios.stubRequest(/\/auth\/accounts\/.*/,
        {
            status: 200,
            response: basic_response_data
        });

    return await cosmos.init(params.mnemonic, params.endpoint);
}

if (0)
{
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
                response_text = err.Error;
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
                response_text = err.Error;
            });
            expect(response_text).equal("could not read key");
        });
    });
}

if (0)
{
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

    debugger;

        it('basic query', async () =>
        {
            // const res = await do_init();
            // expect(res).equal(true);

            const response_data =
                {
                    result: "this is a test"
                };

            moxios.stubRequest(/\/test/,
                {
                    status: 200,
                    response: response_data
                });

            const res2 = await cosmos.query("test");
            expect(res2).equal(response_data.result);
        });

    });
}

if (1)
{
    describe('testing send_transaction', () =>
    {
        beforeEach(() =>
        {
            moxios.install(axios);
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

        it('basic tx', async () =>
        {

        debugger;

            // wait for account request
            const res2 = await do_init();
            expect(res2).equal(true);

            const ep = "create";
            const method = "post";
            const WAIT_TIME = 1000;
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

            // first the library should send a create request to get the tx skeleton
            moxios.wait(function ()
            {
                let request = moxios.requests.mostRecent();
                expect(request.config.url).equal(app_endpoint + app_service + '/' + ep);
                expect(request.config.method).equal(method);

                // then it should sign and broadcast it
                moxios.wait(function ()
                {
                    let request = moxios.requests.mostRecent();
                    expect(request.config.method).equal('post');
                    expect(request.config.url).equal(app_endpoint + '/txs');

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

            const res = await cosmos.send_transaction(method, ep, create_data);




            // it('basic transaction', async () =>
            // {
            //     // first the library should send a create request to get the tx skeleton
            //     moxios.stubRequest(/\/crud\/create/,
            //         {
            //             status: 200,
            //             response: tx_create_skeleton
            //         });
            //
            //     // then it should sign and broadcast it
            //     moxios.wait(function () {
            //         let request = moxios.requests.mostRecent();
            //         console.log(request);
            //
            //         // request.respondWith({
            //         //     status: 200,
            //         //     response: [
            //         //         { id: 1, firstName: 'Fred', lastName: 'Flintstone' },
            //         //         { id: 2, firstName: 'Wilma', lastName: 'Flintstone' }
            //         //     ]
            //         // }).then(function () {
            //         //     let list = document.querySelector('.UserList__Data')
            //         //     equal(list.rows.length, 2)
            //         //     equal(list.rows[0].cells[0].innerHTML, 'Fred')
            //         //     equal(list.rows[1].cells[0].innerHTML, 'Wilma')
            //         //     done()
            //         // });
            //     });
            //
            //     const create_data = {
            //         BaseReq: {
            //             from: params.address,
            //             chain_id: params.chain_id
            //         },
            //         UUID: params.address,
            //         Key: "key",
            //         Value: "value",
            //         Owner: params.address
            //     };
            //
            //     await cosmos.send_transaction('post', create_data);
            //
            //     // then it should poll for result
            //
            // })

        });
    });
}
