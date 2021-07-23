import {APIAndSwarm, DEFAULT_TIMEOUT, defaultGasParams, sentryWithClient} from "../../../helpers/client-helpers";
import {expect} from 'chai';


describe('renewLease()', function () {
    this.timeout(DEFAULT_TIMEOUT);
    let bz: APIAndSwarm;

    beforeEach(() => sentryWithClient()
        .then(db => bz = db)
    );

    it('should increase the lease time in days', () => {
        return bz.create('key', 'value', defaultGasParams(), {days: 1})
            .then(() => bz.getLease('key'))
            .then(lease => expect(lease).to.be.closeTo(86400, 12))
            .then(() => bz.renewLease('key', defaultGasParams(), {days: 2}))
            .then(() => bz.getLease('key'))
            .then(lease => expect(lease).to.be.closeTo(172800, 12));
    });

    it('should reduce the lease time', () => {
        return bz.create('key', 'value', defaultGasParams(), {seconds: 10000})
            .then(() => bz.getLease('key'))
            .then(lease => expect(lease).to.be.closeTo(10000, 12))
            .then(() => bz.renewLease('key', defaultGasParams(), {seconds: 100}))
            .then(() => bz.getLease('key'))
            .then(lease => expect(lease).to.be.closeTo(100, 12));
    });
});