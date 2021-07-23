import {APIAndSwarm, DEFAULT_TIMEOUT, defaultGasParams, sentryWithClient} from "../../../helpers/client-helpers";
import {expect} from 'chai';


describe('count()', function () {
    this.timeout(DEFAULT_TIMEOUT);
    let bz: APIAndSwarm;

    beforeEach(() => sentryWithClient()
        .then(db => bz = db)
    );

    it('should return 0 if no keys', () => {
        return bz.count()
            .then(count => expect(count).to.equal(0));
    });

    it('should return the number of keys', () => {
        return Promise.all([
            bz.create('key1', 'value', defaultGasParams(), {days: 1}),
            bz.create('key2', 'value', defaultGasParams(), {hours: 1}),
            bz.create('key3', 'value', defaultGasParams(), {seconds: 30}),
            bz.create('key4', 'value', defaultGasParams(), {minutes: 1})
        ])
            .then(() => bz.count())
            .then(count => expect(count).to.be.equal(4))
            .then(() => bz.delete('key4', defaultGasParams()))
            .then(() => bz.count())
            .then(count => expect(count).to.be.equal(3));
    });
});