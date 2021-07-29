import {APIAndSwarm, DEFAULT_TIMEOUT, defaultGasParams, sentryWithClient} from "../../../helpers/client-helpers";
import {useChaiAsPromised} from "../../../helpers/global-helpers";
import {expect} from "chai";

describe('owner()', function () {
    this.timeout(DEFAULT_TIMEOUT);
    let bz: APIAndSwarm;

    beforeEach(() => sentryWithClient()
        .then(db => bz = db)
        .then(() => useChaiAsPromised())
    );

    it('should retrieve the owner of a key', () => {
        return bz.create('key', 'value', defaultGasParams())
            .then(() => bz.owner('key'))
            .then(owner => expect(owner).to.equal(bz.address));
    });

    it('should throw an error if key does not exist', () => {
        return expect(bz.owner('noKey')).to.be.rejectedWith('unknown request: key not found');
    });
});
