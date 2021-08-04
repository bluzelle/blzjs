import {DEFAULT_TIMEOUT} from "../../../helpers/client-helpers";
import {Swarm} from '@bluzelle/testing/node_modules/curium-control/daemon-manager/src/Swarm';
import {getSwarm} from "@bluzelle/testing/lib/helpers/swarmHelpers";
import {expect} from "chai";


//Ask Scott about these tests
describe('sentry flag', function () {
    this.timeout(DEFAULT_TIMEOUT);
    let swarm: Swarm;

    beforeEach(() => {
            let start = Date.now()
            getSwarm()
                .then(() => console.log('============= swarm started', Date.now() - start))
        }
    );

    it('should set pex to false on validators', async () => {
        for(const v of swarm.getValidators()) {
            expect(await v.readTextFile('.blzd/config/config.toml')).to.contain('pex = true')
        }
    });
});