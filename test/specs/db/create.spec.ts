import {APIAndSwarm, defaultGasParams, sentryWithClient, DEFAULT_TIMEOUT} from "../../helpers/client-helpers";
import {expect} from 'chai';
import delay from 'delay';
import assert from "assert";

describe('create()', function () {
    this.timeout(DEFAULT_TIMEOUT);
    let bz: APIAndSwarm;

    beforeEach(() => sentryWithClient()
        .then(db => bz = db));

    it("stores a key value pair", () => {
        return bz.create('key', 'value', defaultGasParams())
            .then(() => bz.read('key'))
            .then(val => expect(val).to.equal('value'));
    });

    //Ask whether or not 863995 is the default lease time if an empty object is provided
    it('should allow for empty lease info',() => {
        return bz.create('key', 'value', defaultGasParams(), {})
            .then(() => bz.read('key'))
            .then(val => expect(val).to.equal('value'))
            .then(() => bz.getLease('key'))
            .then(lease => expect(lease).to.be.equal({}));
    });

    ['days', 'hours', 'minutes', 'seconds'].forEach((unit) => {
        it(`should allow lease time in ${unit}`, () => {
            return bz.create('key', 'value', defaultGasParams(), {[unit]: 20})
                .then(() => bz.read('key'))
                .then(val => expect(val).to.equal('value'));
        })
    });

    it('should allow for lease time in multiple units',() => {
        return bz.create('key', 'value', defaultGasParams(), {minutes: 30, hours: 1, days: 1, seconds: 30})
            .then(() => bz.read('key'))
            .then(val => expect(val).to.equal('value'))
            .then(() => bz.getLease('key'))
            .then(lease => expect(lease).to.be.closeTo(91830, 5));
    });

    it('should allow for a long lease period',() => {
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
    })

    it('should timeout a lease after the lease period',async () => {
        return bz.create('key', 'value', defaultGasParams(), {seconds: 10})
            .then(() => delay(11000))
            .then(() => expect(bz.read('key')).to.be.undefined);

        // await bz.create('myKey', 'myValue', defaultGasParams(), {seconds: 10});
        // const start = Date.now();
        // const TIMEOUT = 20000;
        //
        // while ((await canReadKey()) === false);
        //
        // while ((await canReadKey()) && lessThanTimeout());
        //
        // expect(await canReadKey()).to.be.false;
        //
        // async function canReadKey() {
        //     try {
        //         return !!(await bz.read('myKey'));
        //     } catch (e) {
        //         return false;
        //     }
        // }
        //
        // function lessThanTimeout() {
        //     return Date.now() - start < TIMEOUT;
        // }
    })
})