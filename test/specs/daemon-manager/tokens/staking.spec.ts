import {DEFAULT_TIMEOUT} from "../../../helpers/client-helpers";
import {Swarm} from '@bluzelle/testing/node_modules/curium-control/daemon-manager/src/Swarm';
import {getSwarm} from "@bluzelle/testing/lib/helpers/swarmHelpers";
import {expect} from "chai";


//Ask Scott about these tests
describe('staking', function (){
    this.timeout(DEFAULT_TIMEOUT);

    // it('should stake validators with the same amount', async () => {
    //     const swarm:Swarm = await getSwarm([c => ({...c, genesisTokenBalance: 1000})]);
    //     expect(await getVotingPower(swarm)).to.deep.equal(['50','50'] )
    // });
});

const getVotingPower = (swarm: Swarm) =>
    Promise.all(swarm.getValidators()
        .map(v => v.status()
            .then(s => s.validator_info.voting_power)
        ))