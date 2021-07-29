import {
    APIAndSwarm,
    createKeys,
    DEFAULT_TIMEOUT,
    defaultGasParams,
    sentryWithClient
} from "../../../helpers/client-helpers";
import {useChaiAsPromised} from "../../../helpers/global-helpers";
import {expect} from 'chai';

describe('delete()', function () {
    this.timeout(DEFAULT_TIMEOUT);
    let bz: APIAndSwarm;

    beforeEach(() => sentryWithClient()
        .then(db => bz = db)
        .then(() => useChaiAsPromised())
    );

    it('should resolve to chain information', () => {
        return bz.create('key', 'value', defaultGasParams())
            .then(() => bz.delete('key', defaultGasParams()))
            .then(result => {
                expect(result.txhash).to.be.a('string');
                expect(result.height).to.be.a('number');
            });
    });

    it('should delete a key/value pair in the database', () => {
        return bz.create('key', 'value', defaultGasParams())
            .then(() => bz.read('key'))
            .then(value => expect(value).to.equal('value'))
            .then(() => bz.delete('key', defaultGasParams()))
            .then(() => bz.has('key'))
            .then(keyStatus => expect(keyStatus).to.be.false);
    });

    it('should be able to delete an empty value', () => {
        return bz.create('key', '', defaultGasParams())
            .then(() => bz.read('key'))
            .then(value => expect(value).to.equal(''))
            .then(() => bz.delete('key', defaultGasParams()))
            .then(() => bz.has('key'))
            .then(keyStatus => expect(keyStatus).to.be.false);
    });

    it('should throw an error if a key does not exist', () => {
        return bz.delete('key', defaultGasParams())
            .catch(e => expect(e.error).to.equal('invalid request: Key does not exist: failed to execute message'));
    });

    it('should handle parallel deletes', () => {
        return createKeys(bz, 5)
            .then((pairs = {keys: [], values: []}) =>
                Promise.all(pairs.keys.map(key => bz.delete(key, defaultGasParams())))
                    .then(() => bz.keys())
                    .then(keys => expect(keys).to.have.length(0))
            );
    });
});