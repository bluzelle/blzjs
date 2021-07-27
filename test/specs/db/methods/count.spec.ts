import {
    APIAndSwarm,
    createKeys,
    DEFAULT_TIMEOUT,
    defaultGasParams,
    sentryWithClient
} from "../../../helpers/client-helpers";
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
        return createKeys(bz, 5)
            .then(() => bz.count())
            .then(count => expect(count).to.be.equal(5))
            .then(() => bz.delete('key4', defaultGasParams()))
            .then(() => bz.count())
            .then(count => expect(count).to.be.equal(4));
    });
});