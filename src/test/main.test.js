// Copyright (C) 2019 Bluzelle
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License, version 3,
// as published by the Free Software Foundation.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program. If not, see <http://www.gnu.org/licenses/>.

const {bluzelle, version} = require('../main');
const assert = require('assert');
const {random_key} = require('../swarmClient/ecdsa_secp256k1');




const ethereum_rpc = 'http://127.0.0.1:8545';
const contract_address = '0xBBcAd9D022691109F2FBe02dC7bA6c78Ace91361';

const log = false;
const p2p_latency_bound = 100;


describe('', () => {

    it('', async () => {

        const api = await bluzelle({
            ethereum_rpc, 
            contract_address,
            private_pem: random_key(), 
            uuid: Math.random().toString(),
            log,
            p2p_latency_bound,
        });

        assert(!await api.hasDB());

        api.close();

    });

});