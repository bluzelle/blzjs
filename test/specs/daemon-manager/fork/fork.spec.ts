import {DEFAULT_TIMEOUT} from "../../../helpers/client-helpers";
import {getSwarm} from '@bluzelle/testing/lib/helpers/swarmHelpers';
import {Swarm} from '@bluzelle/testing/node_modules/curium-control/daemon-manager/src/Swarm';
import delay from "delay";
import {expect} from "chai";


//Ask Scott about these tests
describe('Swarm.fork()', function (){
    this.timeout(DEFAULT_TIMEOUT);

    it('should start a new swarm with the same accounts', async () => {
        const origSwarm = await getSwarm();
        const somebody = await origSwarm.getValidators()[0].exec('blzcli keys add somebody');
        const transferResult = await origSwarm.getValidators()[0].exec<any>(`blzcli tx send vuser ${(somebody as any).address} 1000000000ubnt --from vuser --gas-prices 0.002ubnt --gas 10000000 --gas-adjustment 2 --broadcast-mode block -y`);
        await origSwarm.waitForTx(transferResult.txhash);
        const valopers = await Promise.all(origSwarm.getValidators().map(v => v.getValoper()));
        const swarmExport = await origSwarm.export({whitelist: valopers});
        await Swarm.stopDaemons(origSwarm.getSwarmConfig());
        await delay(2000)

        console.log('============= start do fork ==================');
        const newSwarm = new Swarm(origSwarm.getSwarmConfig());
        await newSwarm.fork(swarmExport);

        const newSomebody = await newSwarm.exec(`blzcli q account ${(somebody as any).address}`);
        expect((newSomebody as any).value.coins[0].amount).to.equal('1000000000');
    });
});