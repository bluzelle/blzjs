import {DEFAULT_TIMEOUT} from "../../../helpers/client-helpers";
import {expect} from "chai";
import {getSwarm} from '@bluzelle/testing/lib/helpers/swarmHelpers';


// Ask Scott, more Daemon issues
describe('Swarm.export()', function (){
    this.timeout(DEFAULT_TIMEOUT);

    it('should export configs for all daemons', async () => {
        const swarm = await getSwarm();
        const valoper = await swarm.getValidators()[0].getValoper();
        const result = await swarm.export({whitelist: [valoper]});
        expect(result.daemons).to.have.length(swarm.getValidators().length);
        expect(result.genesis).not.to.be.undefined
    });
});