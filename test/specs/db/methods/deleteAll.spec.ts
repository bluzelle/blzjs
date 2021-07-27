import {APIAndSwarm, DEFAULT_TIMEOUT, defaultGasParams, sentryWithClient} from "../../../helpers/client-helpers";
import {expect} from 'chai';

describe('deleteAll()', function () {
    this.timeout(DEFAULT_TIMEOUT);
    let bz: APIAndSwarm;

    beforeEach(() => sentryWithClient()
        .then(db => bz = db));

    it('should do nothing if there are no keys', () => {
        return bz.count()
            .then(count => expect(count).to.equal(0))
            .then(() => bz.deleteAll(defaultGasParams()))
            .then(() => bz.count())
            .then(count => expect(count).to.equal(0));
    });
});