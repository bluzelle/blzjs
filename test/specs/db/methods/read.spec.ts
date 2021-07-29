import {
    APIAndSwarm,
    createKeys,
    DEFAULT_TIMEOUT,
    defaultGasParams,
    sentryWithClient
} from "../../../helpers/client-helpers";
import {useChaiAsPromised} from "../../../helpers/global-helpers";
import {expect} from "chai";

describe('read()', function () {
    this.timeout(DEFAULT_TIMEOUT);
    let bz: APIAndSwarm;

    beforeEach(() => sentryWithClient()
        .then(db => bz = db)
        .then(() => useChaiAsPromised())
    );

    it('should immediately retrieve a value from the store', () => {
        return bz.withTransaction(() => {
            bz.create('key', 'value', defaultGasParams());
            bz.create('key2', 'value', defaultGasParams());
            bz.create('key3', 'value', defaultGasParams());
            bz.create('key4', 'value', defaultGasParams());
        })
            .then(() => bz.read('key2'))
            .then(value => expect(value).to.equal('value'))
            .then(() => bz.read('key3'))
            .then(value => expect(value).to.equal('value'))
            .then(() => bz.read('key4'))
            .then(value => expect(value).to.equal('value'));
    });

    it('should throw an error if key does not exist', () => {
        return expect(bz.read('noKey')).to.be.rejectedWith('unknown request: key not found');
    });

    it('should handle parallel reads', () => {
        return createKeys(bz, 5)
            .then((pairs = {keys: [], values: []}) =>
                Promise.all(pairs.keys.map(key => bz.read(key)))
                    .then(testValues => expect(testValues).to.deep.equal(pairs.values))
            );
    });
});