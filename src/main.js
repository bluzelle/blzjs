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
    
    bluzelle: async ({ethereum_rpc, contract_address, ...args}) => {

        // fetch peerslist data

        const web3 = new Web3(ethereum_rpc); //new Web3.providers.HttpProvider('mainnet.infura.io/v3/1c197bf729ee454a8ab7f4e80a1ea628'));

        const BluzelleESR = web3.eth.Contract(abi, contract_address);

        let swarms = await getSwarms(BluzelleESR);

        swarms = Object.entries(swarms).map(([swarm_id, swarm]) =>
            swarmClient({
                peerslist: swarm.peers,
                swarm_id,
                ...args
            }));


        // default to first swarm for now
        return swarms[0];

    },

    version: require('../package.json').version

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


