import {
    APIAndSwarm,
    createNewBzClient,
    DEFAULT_TIMEOUT,
    defaultGasParams,
    sentryWithClient
} from "../../../helpers/client-helpers";
import {bluzelle} from "../../../../client";
import {expect} from "chai";
import delay from "delay";

describe('myKeys()', function () {
    this.timeout(DEFAULT_TIMEOUT);
    let bz: APIAndSwarm;

    beforeEach(() => sentryWithClient()
        .then(db => bz = db)
    );

    it('should return a list of only keys that I own', () => {
        return createNewBzClient(bz)
            .then(bz2 =>
                bz.withTransaction(() => {
                    bz.create('key1', 'value', defaultGasParams());
                    bz.create('key2', 'value', defaultGasParams());
                    bz2.create('diffKey', 'value', defaultGasParams());
                })
                    .then(() => bz.myKeys())
                    .then(keys => expect(keys).to.deep.equal(['key1', 'key2']))
                    .then(() => bz2.myKeys())
                    .then(diffKeys => expect(diffKeys).to.deep.equal(['diffKey']))
            );
    });

    it('should not show keys that have been deleted', () => {
        return bz.withTransaction(() => {
            bz.create('key1', 'value', defaultGasParams());
            bz.create('key2', 'value', defaultGasParams());
        })
            .then(() => bz.myKeys())
            .then(keys => expect(keys).to.deep.equal(['key1', 'key2']))
            .then(() => bz.delete('key1', defaultGasParams()))
            .then(() => bz.myKeys())
            .then(keys => expect(keys).to.deep.equal(['key2']));
    });

    it('should not show a key after it expires', () => {
        return bz.withTransaction(() => {
            bz.create('key1', 'value', defaultGasParams(), {seconds: 10});
            bz.create('key2', 'value', defaultGasParams());
        })
            .then(() => bz.myKeys())
            .then(keys => expect(keys).to.deep.equal(['key1', 'key2']))
            .then(() => delay(12000))
            .then(() => bz.myKeys())
            .then(keys => expect(keys).to.deep.equal(['key2']));
    });

    it('should not show keys after a deleteAll', () => {
        return createNewBzClient(bz)
            .then(bz2 =>
                bz.withTransaction(() => {
                    bz.create('key1', 'value', defaultGasParams());
                    bz.create('key2', 'value', defaultGasParams());
                    bz2.create('diffKey', 'value', defaultGasParams());
                })
                    .then(() => bz.myKeys())
                    .then(keys => expect(keys).to.deep.equal(['key1', 'key2']))
                    .then(() => bz.deleteAll(defaultGasParams()))
                    .then(() => bz.myKeys())
                    .then(keys => expect(keys).to.deep.equal([]))
                    .then(() => bz2.myKeys())
                    .then(keys => expect(keys).to.deep.equal(['diffKey']))
                    .then(() => bz2.deleteAll(defaultGasParams()))
                    .then(() => bz2.myKeys())
                    .then(keys => expect(keys).to.deep.equal([]))
            );
    });

    it('should show the right keys if you rename a key', () => {
        return bz.withTransaction(() => {
            bz.create('key1', 'value', defaultGasParams());
            bz.create('key2', 'value', defaultGasParams());
        })
            .then(() => bz.myKeys())
            .then(keys => expect(keys).to.deep.equal(['key1', 'key2']))
            .then(() => bz.rename('key1', 'newKeyName', defaultGasParams()))
            .then(() => bz.myKeys())
            .then(keys => expect(keys).to.deep.equal(['key2', 'newKeyName']));
    });
});