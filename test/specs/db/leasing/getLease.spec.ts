import {APIAndSwarm, DEFAULT_TIMEOUT, sentryWithClient} from "../../../helpers/client-helpers";
import {useChaiAsPromised} from "../../../helpers/global-helpers";
import {expect} from 'chai';


describe('getLease', function (){
   this.timeout(DEFAULT_TIMEOUT);
   let bz: APIAndSwarm;


    beforeEach(() => sentryWithClient()
        .then(db => bz = db));

    beforeEach(()=> useChaiAsPromised());

    it('should throw exception if key does not exist', async () => {
        await expect(bz.getLease('myKey')).to.be.rejectedWith(/key not found/);
    })
});