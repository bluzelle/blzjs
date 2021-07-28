import {APIAndSwarm, DEFAULT_TIMEOUT, defaultGasParams, sentryWithClient} from "../../../helpers/client-helpers";
import {expect} from 'chai';

describe('has()', function () {
    this.timeout(DEFAULT_TIMEOUT);
    let bz: APIAndSwarm;

    beforeEach(() => sentryWithClient()
        .then(db => bz = db)
    );

    it('should return false if the key does not exist', () => {
        return bz.has('key')
            .then(keyStatus => expect(keyStatus).to.be.false);
    });

    it('should return true if key exists', async () => {
        return bz.create('key', 'value', defaultGasParams())
            .then(() => bz.has('mkey'))
            .then(keyStatus => expect(keyStatus).to.be.false);
    });

    it('should work with an empty value', () => {
        return bz.create('key', '', defaultGasParams())
            .then(() => bz.has('key'))
            .then(keyStatus => expect(keyStatus).to.be.true);
    });
});