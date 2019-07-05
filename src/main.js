//
// Copyright (C) 2019 Bluzelle
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

const {swarmClient} = require('./swarmClient/main');
const default_connection = require('../default_connection');

const Web3 = require('web3');

const abi = require('../BluzelleESR/build/contracts/BluzelleESR.json').abi;


module.exports = {

    bluzelle: async ({ethereum_rpc, contract_address, _connect_to_all, log, ...args}) => {
        
        ethereum_rpc = ethereum_rpc || default_connection.ethereum_rpc;
        contract_address = contract_address || default_connection.contract_address;
        
        // fetch peerslist data

        const web3js = new Web3(new Web3.providers.HttpProvider(ethereum_rpc));


        const BluzelleESR = new web3js.eth.Contract(abi, contract_address);

        let swarms = await getSwarms(BluzelleESR);

        log && console.log('ESR swarms:', JSON.stringify(swarms, null, 4));

        swarms = Object.entries(swarms).map(([swarm_id, swarm]) =>
            swarmClient({
                peerslist: swarm.peers,
                swarm_id,
                log,
                ...args
            }));



        // instead of rejecting, resolve with undefined
        const resolveAnyCase = p => new Promise(r => p.then(r, e => console.error(e) || r()));

        // wait for swarms to open
        swarms = await Promise.all(swarms.map(resolveAnyCase));


        // filter dead swarms
        swarms = swarms.filter(p => p !== 'undefined');


        if(_connect_to_all) {
            return swarms;
        }


        const resolveIfTruthy = p => new Promise(res => p.then(v => v && res(v)));
        const resolveIfFalsy = p => new Promise(res => p.then(v => v || res(v)));


        const hasDbs = swarms.map(swarm => swarm._hasDB());

        const hasDbSwarms = hasDbs.map((hasDB, i) => promise_const(resolveIfTruthy(hasDB), swarms[i]));

        // resolves with swarm client if uuid exists
        const swarm_with_uuid = Promise.race(hasDbSwarms);


        // resolves to false if uuid doesn't exist
        const uuid_doesnt_exist = promise_const(Promise.all(hasDbs.map(resolveIfFalsy)), false);


        const swarm = await Promise.race([swarm_with_uuid, uuid_doesnt_exist]);

        if(!swarm) {

            throw new Error('UUID does not exist in the Bluzelle swarm. Contact us at https://gitter.im/bluzelle/Lobby.');

        }


        // close all other swarms & return client

        swarms.forEach(s => s !== swarm && s.close());

        return swarm;

    },

    version: require('../package.json').version

};


const promise_const = async (p, v) => {
    await p;
    return v;
};

const getSwarms = async BluzelleESR => {

    let swarmList = await BluzelleESR.methods.getSwarmList().call();

    swarmList = swarmList.filter(v => v !== '');

    const swarmPromises = swarmList.map(swarm => getSwarm(BluzelleESR, swarm));

    const swarms = await Promise.all(swarmPromises);


    const out = {};

    swarmList.forEach((swarm, i) => out[swarm] = swarms[i]);

    return out;

};


const getSwarm = async (BluzelleESR, swarm) => {

    const swarmInfo = await BluzelleESR.methods.getSwarmInfo(swarm).call();

    swarmInfo.nodelist = swarmInfo.nodelist.filter(v => v !== '');

    const nodePromises = swarmInfo.nodelist.map(node =>
            BluzelleESR.methods.getNodeInfo(swarm, node).call());

    let nodes = await Promise.all(nodePromises);

    // Convert from bigInts to js ints
    nodes = nodes.map(node => ({
        nodeCount: Number(node.nodeCount),
        nodeHost: node.nodeHost,
        nodeName: node.nodeName,
        nodePort: Number(node.nodePort),
    }));


    const out = {
        peers: {}
    };

    swarmInfo.nodelist.forEach((node, i) => out.peers[node] = nodes[i]);

    out.metadata = {
        size: Number(swarmInfo.size),
        geo: swarmInfo.geo,
        trust: swarmInfo.trust,
        swarmtype: swarmInfo.swarmtype,
        cost: Number(swarmInfo.cost)
    };

    return out;

};


