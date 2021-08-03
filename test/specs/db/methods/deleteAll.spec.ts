import {
    APIAndSwarm,
    createKeys,
    DEFAULT_TIMEOUT,
    defaultGasParams, createNewBzClient,
    sentryWithClient
} from "../../../helpers/client-helpers";
import {expect} from 'chai';
import {useChaiAsPromised} from "../../../helpers/global-helpers";

describe('deleteAll()', function () {
    this.timeout(DEFAULT_TIMEOUT);
    let bz: APIAndSwarm;

    beforeEach(() => sentryWithClient()
        .then(db => {
            bz = db
            useChaiAsPromised()
        })
    );

    it('should do nothing if there are no keys', () => {
        return bz.count()
            .then(count => expect(count).to.equal(0))
            .then(() => bz.deleteAll(defaultGasParams()))
            .then(() => bz.count())
            .then(count => expect(count).to.equal(0));
    });

    it('should delete all keys', () => {
        return createKeys(bz, 5)
            .then(() => bz.count())
            .then(count => expect(count).to.equal(5))
            .then(() => bz.deleteAll(defaultGasParams()))
            .then(() => bz.count())
            .then(count => expect(count).to.equal(0));
    });

    it('should delete all keys that you own and only keys that you own', () => {
        return createNewBzClient(bz)
            .then(bz2 =>
                bz.withTransaction(() => {
                    bz.create('key1', 'value', defaultGasParams());
                    bz.create('key2', 'value', defaultGasParams());
                    bz.create('key3', 'value', defaultGasParams());
                    bz.create('key4', 'value', defaultGasParams());
                    bz2.create('notMyKey', 'notMyValue', defaultGasParams());
                })
                    .then(() => bz.deleteAll(defaultGasParams()))
                    .then(() => bz2.keys())
                    .then(keysResult => expect(keysResult).to.deep.equal(['notMyKey']))
            );
    });
});