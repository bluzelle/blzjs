#!/usr/bin/node

//import axios from 'axios'
const moxios = require('moxios');
//import sinon from 'sinon'

const axios = require('axios');
// const moxios = require('moxios');

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
    chain_id: "bluzelle"
};


describe('testing api', () =>
{
    beforeEach(() =>
    {
        //moxios.install(cosmos.axios);
        moxios.install(axios);
    });
    afterEach(() =>
    {
        //moxios.uninstall(cosmos.axios);
        moxios.uninstall(axios);
    });

    it('initializes', async () =>
    {
        moxios.stubRequest(/accounts.*/,
        {
            status: 500,
            responseText: '{"key" : "mykey", "value" " : "myvalue"}'
        });

        await cosmos.init(params.mnemonic, params.endpoint);

        // bluzelle({
        //     address: 'cosmos1zuxcvpkxlzf37dh4k95e2rujmy9sxqvxhaj5pn',
        //     mnemonic: 'desert maple evoke popular trumpet beach primary decline visit enhance dish drink excite setup public forward ladder girl end genre symbol alter category choose',
        //     endpoint: "http://localhost:1317",
        //     chain_id: "bluzelle"
        // }).then(function(bz)
        // {
            //        moxios.stubRequest((`${app_endpoint}/auth/accounts/cosmos1zuxcvpkxlzf37dh4k95e2rujmy9sxqvxhaj5pn`),
            //         moxios.stubRequest(('.*/auth/accounts/.*'),
            //         {
            //             status: 200,
            //             responseText: '{"key" : "mykey", "value" " : "myvalue"}'
            //         });

            //        moxios.stubRequest((`${app_endpoint}${app_service}/read/cosmos1zuxcvpkxlzf37dh4k95e2rujmy9sxqvxhaj5pn/mykey`),
            //         moxios.stubRequest(('.*/read/.*'),
            //             {
            //                 status: 200,
            //                 responseText: '{"key" : "mykey", "value" " : "myvalue"}'
            //             });

            // bz.quickread("mykey").then(function(res)
            // {
            //     expect(res).toEqual("myvalue");
            // });

        // });

    });
});