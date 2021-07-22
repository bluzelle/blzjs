import {APIAndSwarm, DEFAULT_TIMEOUT, defaultGasParams, sentryWithClient} from "../../../helpers/client-helpers";
import {expect} from 'chai';


describe('renewLease', function() {
    this.timeout(DEFAULT_TIMEOUT);
    let bz: APIAndSwarm;

    beforeEach(() => sentryWithClient()
        .then(db => bz =db));

    it('should increase the lease time in days', async () => {
        await bz.create('myKey', 'myValue', defaultGasParams(), {days: 1});
        expect(await bz.getLease('myKey')).to.be.closeTo(86400, 12);
        await bz.renewLease('myKey', defaultGasParams(), {days: 2});
        expect(await bz.getLease('myKey')).to.be.closeTo(172800, 12);
    });
});