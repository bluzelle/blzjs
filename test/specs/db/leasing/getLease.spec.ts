import {APIAndSwarm, DEFAULT_TIMEOUT, sentryWithClient} from "../../../helpers/client-helpers";
import {expect} from 'chai';


describe('getLease', ()=> {
   this.timeout(DEFAULT_TIMEOUT);
   let bz: APIAndSwarm;

    beforeEach(() => sentryWithClient()
        .then(db => bz = db));

    it('should throw exception if key does not exist', async () => {
        await expect(bz.getLease('myKey')).to.be.rejectedWith(/key not found/);
    })
});