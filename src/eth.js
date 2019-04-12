const Web3 = require('web3');

const web3 = new Web3('http://127.0.0.1:7545'); //new Web3.providers.HttpProvider('mainnet.infura.io/v3/1c197bf729ee454a8ab7f4e80a1ea628'));


const abi = [
    {
        "constant": true,
        "inputs": [],
        "name": "getSwarmList",
        "outputs": [
            {
                "name": "",
                "type": "bytes32[]"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "isActive",
        "outputs": [
            {
                "name": "",
                "type": "bool"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [
            {
                "name": "swarmID",
                "type": "bytes32"
            }
        ],
        "name": "getSwarmInfo",
        "outputs": [
            {
                "name": "size",
                "type": "uint256"
            },
            {
                "name": "geo",
                "type": "bytes32"
            },
            {
                "name": "trust",
                "type": "bool"
            },
            {
                "name": "swarmtype",
                "type": "bytes32"
            },
            {
                "name": "cost",
                "type": "uint256"
            },
            {
                "name": "nodelist",
                "type": "bytes32[]"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [
            {
                "name": "swarmID",
                "type": "bytes32"
            },
            {
                "name": "nodeHostName",
                "type": "bytes32"
            }
        ],
        "name": "getNodeInfo",
        "outputs": [
            {
                "name": "hostname",
                "type": "bytes32"
            },
            {
                "name": "status",
                "type": "bytes32"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [
            {
                "name": "swarmID",
                "type": "bytes32"
            }
        ],
        "name": "getNodeList",
        "outputs": [
            {
                "name": "",
                "type": "bytes32[]"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "ownerAddress",
        "outputs": [
            {
                "name": "",
                "type": "address"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "name": "swarmID",
                "type": "bytes32"
            },
            {
                "name": "swarmSize",
                "type": "uint256"
            },
            {
                "name": "swarmGeo",
                "type": "bytes32"
            },
            {
                "name": "isTrusted",
                "type": "bool"
            },
            {
                "name": "swarmType",
                "type": "bytes32"
            },
            {
                "name": "swarmCost",
                "type": "uint256"
            },
            {
                "name": "nodeList",
                "type": "bytes32[]"
            }
        ],
        "name": "addSwarm",
        "outputs": [
            {
                "name": "success",
                "type": "bool"
            }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "name": "swarmID",
                "type": "bytes32"
            },
            {
                "name": "nodeHostName",
                "type": "bytes32"
            }
        ],
        "name": "removeNode",
        "outputs": [
            {
                "name": "success",
                "type": "bool"
            }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [],
        "name": "deactivateContract",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "name": "swarmID",
                "type": "bytes32"
            },
            {
                "name": "nodeHostName",
                "type": "bytes32"
            },
            {
                "name": "nodeStatus",
                "type": "bytes32"
            }
        ],
        "name": "addNode",
        "outputs": [
            {
                "name": "success",
                "type": "bool"
            }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "getSwarmCount",
        "outputs": [
            {
                "name": "",
                "type": "uint256"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "name": "swarmID",
                "type": "bytes32"
            }
        ],
        "name": "removeSwarm",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [
            {
                "name": "swarmID",
                "type": "bytes32"
            }
        ],
        "name": "getNodeCount",
        "outputs": [
            {
                "name": "",
                "type": "uint256"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "constructor"
    }
];


const contract = new web3.eth.Contract(abi, '0x87B5ca8c88c90873Ac8f3c0AF158f54B9388C703');


const main = async () => {

    const swarms = await contract.methods.getSwarmList().call();

    console.log(swarms);

};


main();

