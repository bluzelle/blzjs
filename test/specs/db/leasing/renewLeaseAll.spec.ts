import {APIAndSwarm, DEFAULT_TIMEOUT, defaultGasParams, sentryWithClient} from "../../../helpers/client-helpers";
import {expect} from 'chai';


describe('renewLeaseAll()', function () {
    this.timeout(DEFAULT_TIMEOUT);
    let bz: APIAndSwarm;

    beforeEach(() => sentryWithClient()
        .then(db => bz = db)
    );

    it('should increase the lease time to the amount passed', () => {
        return bz.create('key1', 'value', defaultGasParams(), {days: 1})
            .then(() => bz.create('key2', 'value', defaultGasParams(), {days: 2}))
            .then(() => bz.getLease('key1'))
            .then(lease => expect(lease).to.be.closeTo(86400, 12))
            .then(() => bz.getLease('key2'))
            .then(lease => expect(lease).to.be.closeTo(86400 * 2, 12))
            .then(() => bz.renewLeaseAll(defaultGasParams(), {days: 2}))
            .then(() => bz.getLease('key1'))
            .then(lease => expect(lease).to.be.closeTo(86400 * 2, 5))
            .then(() => bz.getLease('key2'))
            .then(lease => expect(lease).to.be.closeTo(86400 * 2, 5));
    });

    it('should restore the lease time to 10 days if no lease passed', () => {
        return bz.create('key1', 'value', defaultGasParams(), {seconds: 30})
            .then(() => bz.create('key2', 'value', defaultGasParams(), {seconds: 60}))
            .then(() => bz.getLease('key1'))
            .then(lease1 => expect(lease1).to.be.closeTo(30, 12))
            .then(() => bz.getLease('key2'))
            .then(lease2 => expect(lease2).to.be.closeTo(60, 12))
            .then(() => bz.renewLeaseAll(defaultGasParams()))
            .then(() => bz.getLease('key1'))
            .then(lease1 => expect(lease1).to.be.closeTo(864000, 12))
            .then(() => bz.getLease('key2'))
            .then(lease2 => expect(lease2).to.be.closeTo(864000, 12));
    });

    it('should charge for the extra time on the lease', async () => {
        const leaseRate10 = 2.9615511;
        const leaseRate20 = 2.7949135;
        const leaseRate40 = 2.1353288;

        const value = 'a'.repeat(200000)

        await bz.create('foo', value, defaultGasParams(), {days: 10});
        const renew1 = await bz.renewLeaseAll(defaultGasParams(), {days: 20});
        const renew2 = await bz.renewLeaseAll(defaultGasParams(), {days: 40});

        const calculateLeaseCost = (rate: number, days: number) =>
            Math.round(rate * days * (bz.uuid.length + 'foo'.length + value.length))

        const leaseGas1 = calculateLeaseCost(leaseRate20, 20) - calculateLeaseCost(leaseRate10, 10);
        const leaseGas2 = calculateLeaseCost(leaseRate40, 40) - calculateLeaseCost(leaseRate20, 20);

        // using closeTo due to possible rounding error
        expect(renew1.gasUsed - leaseGas1)
            .to.be.closeTo(renew2.gasUsed - leaseGas2, 10);
    });
});