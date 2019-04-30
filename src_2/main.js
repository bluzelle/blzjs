const {bluzelle} = require('../src/main');
const Web3 = require('web3');
const abi = require('../BluzelleESR/build/contracts/BluzelleESR.json').abi;


module.exports = {
    
    bluzelle: async ({ethereum_rpc, contract_address, ...args}) => {

        // fetch peerslist data

        const web3 = new Web3(ethereum_rpc); //new Web3.providers.HttpProvider('mainnet.infura.io/v3/1c197bf729ee454a8ab7f4e80a1ea628'));

        const BluzelleESR = web3.eth.Contract(abi, contract_address);

        console.log(await getSwarms(BluzelleESR));

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


    const out = {};

    swarmInfo.nodelist.forEach((node, i) => out[node] = nodes[i]);

    out.metadata = {
        size: Number(swarmInfo.size),
        geo: swarmInfo.geo,
        trust: swarmInfo.trust,
        swarmtype: swarmInfo.swarmtype,
        cost: Number(swarmInfo.cost)
    };

    return out;

};


