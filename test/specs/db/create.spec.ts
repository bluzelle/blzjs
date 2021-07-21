import {APIAndSwarm, defaultGasParams, sentryWithClient, DEFAULT_TIMEOUT} from "../../helpers/client-helpers";
import {expect} from 'chai';

describe('create()', function () {
    this.timeout(DEFAULT_TIMEOUT);
    let bz: APIAndSwarm;

    beforeEach(() => sentryWithClient()
        .then(db => bz = db));

    it("creates a key value pair", () => {
        return bz.create('key', 'value', defaultGasParams())
            .then(() => bz.read('key'))
            .then(val => expect(val).to.equal('value'))
    });

    ['days', 'hours', 'minutes', 'seconds'].forEach((unit) => {
        it(`should allow lease time in ${unit}`, () => {
            return bz.create('key', 'value', defaultGasParams(), {[unit]: 20})
                .then(() => bz.read('key'))
                .then(val => expect(val).to.equal('value'))
        })
    });


})