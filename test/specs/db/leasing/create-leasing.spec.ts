import {APIAndSwarm, defaultGasParams, sentryWithClient, DEFAULT_TIMEOUT} from "../../../helpers/client-helpers";
import {expect} from 'chai';
import delay from 'delay';
import {useChaiAsPromised} from "../../../helpers/global-helpers";


describe('create()', function () {
    this.timeout(DEFAULT_TIMEOUT);
    let bz: APIAndSwarm;

    beforeEach(() => sentryWithClient()
        .then(db => bz = db)
        .then(() => useChaiAsPromised())
    );

    it("stores a key value pair", () => {
        return bz.create('key', 'value', defaultGasParams())
            .then(() => bz.read('key'))
            .then(val => expect(val).to.equal('value'));
    });

    it('should allow for empty lease info', () => {
        return bz.create('key', 'value', defaultGasParams(), {})
            .then(() => bz.read('key'))
            .then(val => expect(val).to.equal('value'))
            .then(() => bz.getLease('key'))
            .then(lease => expect(lease).to.be.equal(863995));
    });

    ['days', 'hours', 'minutes', 'seconds'].forEach((unit) => {
        it(`should allow lease time in ${unit}`, () => {
            return bz.create('key', 'value', defaultGasParams(), {[unit]: 20})
                .then(() => bz.read('key'))
                .then(val => expect(val).to.equal('value'));
        });
    });

    it('should allow for lease time in multiple units', () => {
        return bz.create('key', 'value', defaultGasParams(), {minutes: 30, hours: 1, days: 1, seconds: 30})
            .then(() => bz.read('key'))
            .then(val => expect(val).to.equal('value'))
            .then(() => bz.getLease('key'))
            .then(lease => expect(lease).to.be.closeTo(91830, 5));
    });

    it('should allow for a long lease period', () => {
        return bz.create('key', 'value', defaultGasParams(), {days: 180})
            .then(() => bz.read('key'))
            .then(val => expect(val).to.equal('value'))
            .then(() => bz.getLease('key'))
            .then(lease => expect(lease).to.be.closeTo(86400 * 180, 5));
    });

    it('should not timeout a lease before the lease time expires', () => {
        return bz.create('key', 'value', defaultGasParams(), {seconds: 10})
            .then(() => delay(9000))
            .then(() => bz.read('key'))
            .then(val => expect(val).to.equal('value'));
    });

    it('should timeout a lease after the lease period', () => {
        return bz.create('key', 'value', defaultGasParams(), {seconds: 10})
            .then(() => delay(11000))
            .then(() => bz.has('key'))
            .then(keyResult => expect(keyResult).to.be.false);
    });

    it.skip('should charge extra for longer leases', async () => {
        const value = 'a'.repeat(200000)
        const c1 = {
            days: 10,
            leaseRate: 2.9615511
        }
        const c2 = {
            days: 20,
            leaseRate: 2.7949135
        }
        const create1 = await bz.create('foo1', value, defaultGasParams(), {days: c1.days});
        const create2 = await bz.create('foo2', value, defaultGasParams(), {days: c2.days});

        const calculateLeaseCost = (rate: number, days: number) =>
            Math.round(rate * days * (bz.uuid.length + 'foo1'.length + value.length))

        expect(create1.gasUsed - calculateLeaseCost(c1.leaseRate, c1.days))
            .to.be.closeTo(create2.gasUsed - calculateLeaseCost(c2.leaseRate, c2.days), 3)
    });
});