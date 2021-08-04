import {DEFAULT_TIMEOUT} from "../../helpers/client-helpers";
import {getSwarm} from "@bluzelle/testing/lib/helpers/swarmHelpers";
import {expect} from "chai";

//Ask Scott Daemon issues
describe('Swarm', function (){
    this.timeout(DEFAULT_TIMEOUT);

    describe('getDaemons()',  () =>{
        it('Should return a list of daemons', () =>{
            return getSwarm()
                .then(swarm => expect(swarm.getDaemons()).to.have.length(0))
        });
    });
});