import {APIAndSwarm, DEFAULT_TIMEOUT, defaultGasParams, sentryWithClient} from "../../../helpers/client-helpers";
import {expect} from 'chai';

describe('renewLeaseAll', function(){
   this.timeout(DEFAULT_TIMEOUT);
   let bz: APIAndSwarm;

   beforeEach(() => sentryWithClient()
       .then(db => bz = db));

    it('should increase the lease time to the amount passed', async () => {
        return bz.create('key1', 'myValue', defaultGasParams(), {days: 1})
            .then(() => bz.create('key2', 'myValue', defaultGasParams(), {days: 2}))
            .then(() => bz.getLease('key1'))
            .then(lease => expect(lease).to.be.closeTo(86400, 12))
            .then(() => bz.getLease('key2'))
            .then(lease => expect(lease).to.be.closeTo(86400 * 2, 12))
            .then(() => bz.renewLeaseAll(defaultGasParams(), {days:2}))
            .then(() => bz.getLease('key1'))
            .then(lease => expect(lease).to.be.closeTo(86400 * 2, 5))
            .then(() => bz.getLease('key2'))
            .then(lease => expect(lease).to.be.closeTo(86400 * 2, 5))
    })

    it('should restore the lease time to 10 days if no lease passed', async () => {
        await bz.create('key1', 'myValue', defaultGasParams(), {seconds: 30});
        await bz.create('key2', 'myValue', defaultGasParams(), {seconds: 60});
        expect(await bz.getLease('key1')).to.be.closeTo(30, 12);
        expect(await bz.getLease('key2')).to.be.closeTo(60, 12);
        await bz.renewLeaseAll(defaultGasParams());
        expect(await bz.getLease('key1')).to.be.closeTo(864000, 12)
        expect(await bz.getLease('key1')).to.be.closeTo(864000, 12)
    });
});