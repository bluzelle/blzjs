var BluzelleESR = artifacts.require("./BluzelleESR.sol");
var fs = require('fs');

var receipts = []

//record transaction summary
function recordTransaction(description, receipt, display) {
    if (display) {
        console.log("TxID     : " + receipt.transactionHash)
        console.log("Gas used : " + receipt.gasUsed)
    }

    receipts.push([ description, receipt ])
}


const rndString = () => new Array(10).fill(0).map(() => Math.floor(Math.random() * 10)).join('');


const addSwarm = async (json, BluzelleESRInstance) => {

    await BluzelleESRInstance.addSwarm(json.swarm_id,7,"Canada",true,"Disk",0,[],{ from: myAccount });

    for(var i=0; i<json.peers.length; i++){
        await BluzelleESRInstance.addNode(json.swarm_id,
            json.peers[i].host,
            json.peers[i].name,
            json.peers[i].http_port,
            json.peers[i].port,
            json.peers[i].uuid
            );
    }


};



// Run this first:
// npx ganache-cli --account="0x1f0d511e990ddbfec302e266d62542384f755f6cc6b3161b2e49a2a4e6c4be3d,100000000000000000000"

// account: 0xaa81f360c6bbef505b28760fee25443f9d33e499

//owner
//const myAccount = "0xaa81f360c6bbef505b28760fee25443f9d33e499";
const myAccount = "0xdD178A20eF01d76cC2066F16a155F4134A68A170";


module.exports = async () => main().catch(e => console.error(e));
const main = async () => {


    let BluzelleESRInstance = await BluzelleESR.new({ from: myAccount });
    let receiptTx = await web3.eth.getTransactionReceipt(BluzelleESRInstance.transactionHash);
    let AddressBluzelleESR = BluzelleESRInstance.address;


    recordTransaction("BluzelleESR.new", receiptTx, true);


    const ps = fs.readdirSync('../swarmDB/local/nodes').filter(s => /^swarm.*\.json$/.exec(s)).map(async file => {

        const f = '../swarmDB/local/nodes/' + file;
        const json = JSON.parse(fs.readFileSync(f, 'utf8'));

        await addSwarm(json, BluzelleESRInstance);

    });

    await Promise.all(ps);

    
    //
    // Gas Statistics
    //
    // console.log('----------------------------------------------------------------------------------')
    // console.log('Gas usage summary')
    // console.log('----------------------------------------------------------------------------------')
    // var totalGas = 0
    // for (i = 0; i < receipts.length; i++) {
    //    console.log(receipts[i][0].padEnd(33) + receipts[i][1].gasUsed)
    //    totalGas += receipts[i][1].gasUsed
    // }
    // console.log('----------------------------------------------------------------------------------')
    // console.log('Total gas recorded '.padEnd(33) + totalGas)

    console.log('')
    console.log('Deployment completed successfully.')

    console.log('')

    console.log("Address of Bluzelle ESR Contract: \x1b[40m\x1b[37m" + AddressBluzelleESR + "\x1b[0m");


    process.exit()
};







