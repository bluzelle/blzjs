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

const {swarmClient} = require('./swarmClient/main');
const Web3 = require('web3');
const abi = require('../BluzelleESR/build/contracts/BluzelleESR.json').abi;

module.exports = {
    
    bluzelle: async ({ethereum_rpc, contract_address, _connect_to_all, ...args}) => {


        // fetch peerslist data

        const web3 = new Web3(ethereum_rpc);

        const BluzelleESR = web3.eth.Contract(abi, contract_address);

        let swarms = await getSwarms(BluzelleESR);

        swarms = Object.entries(swarms).map(([swarm_id, swarm]) =>
            swarmClient({
                peerslist: swarm.peers,
                swarm_id,
                ...args
            }));


        if(_connect_to_all) {
            return swarms;
        }

        // 1. The swarmID's are copied in each of the config files and not part of the main script
        // 2. The secret key needs a way to be communicated

        // -> 2. can just be a const copied in run-swarms and the test script
        // -> 1. we can make another file for our own use.


        // 2. reimplement fastest connection to not use status (should be a simplification)


        const resolveIfTruthy = p => new Promise(res => p.then(v => v && res(v)));
        const resolveIfFalsy = p => new Promise(res => p.then(v => v || res(v)));



        const hasDbs = swarms.map(swarm => swarm.hasDB());

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

    const swarmList = await BluzelleESR.methods.getSwarmList().call();

    const swarmPromises = swarmList.map(getSwarm.bind(null, BluzelleESR));

    const swarms = await Promise.all(swarmPromises);
    

    const out = {};

    swarmList.forEach((swarm, i) => out[swarm] = swarms[i]);

    return out;

};


const getSwarm = async (BluzelleESR, swarm) => {

    const swarmInfo = await BluzelleESR.methods.getSwarmInfo(swarm).call();

    const nodePromises = swarmInfo.nodelist.map(node => 
            BluzelleESR.methods.getNodeInfo(swarm, node).call());

    let nodes = await Promise.all(nodePromises);

    // Convert from bigInts to js ints
    nodes = nodes.map(node => ({
        nodeCount: Number(node.nodeCount),
        nodeHost: node.nodeHost,
        nodeHttpPort: Number(node.nodeHttpPort),
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


