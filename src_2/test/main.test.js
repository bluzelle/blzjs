 const {bluzelle, version} = require('../main');
const assert = require('assert');
const {random_key} = require('../../src/ecdsa_secp256k1');



const log = false;
const p2p_latency_bound = 100;


const ethereum_rpc = 'http://127.0.0.1:8545';
const contract_address = '0x9d15DE30D9f55CAb40dd5691940C68268C8D23c2';


describe('', () => {

    it('', async () => {

        const api = await bluzelle({ethereum_rpc, contract_address});

    });

});