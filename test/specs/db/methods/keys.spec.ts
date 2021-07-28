import {
    APIAndSwarm,
    createKeys,
    DEFAULT_TIMEOUT,
    defaultGasParams, newBzClient,
    sentryWithClient
} from "../../../helpers/client-helpers";
import {expect} from 'chai';
import {bluzelle} from "../../../../client";

describe('keys()', function () {
    this.timeout(DEFAULT_TIMEOUT);
    let bz: APIAndSwarm;

    beforeEach(() => sentryWithClient()
        .then(db => bz = db)
    );

    it('should return a empty list if there are no keys', () => {
        return bz.keys()
            .then(keys => expect(keys).to.have.length(0));
    });

    it('should work with an empty value', () => {
        return bz.withTransaction(() => {
            bz.create('key1', 'value', defaultGasParams());
            bz.create('key2', '', defaultGasParams());
        })
            .then(() => bz.keys())
            .then(keys => expect(keys).to.deep.equal(['key1', 'key2']));
    });

    it('should return a list of keys', async () => {
        const {keys} = await createKeys(bz, 5);

        return bz.keys()
            .then(testKeys => expect(testKeys).to.deep.equal(keys));
    });

    it('should return all keys including ones that are not mine', async () => {
        const bz2 = await newBzClient(bz);

        return bz.withTransaction(() => {
            bz.create('key1', 'value', defaultGasParams());
            bz.create('key2', 'value', defaultGasParams());
            bz2.create('other', 'value', defaultGasParams());
        })
            .then(() => bz.keys())
            .then(keys => )

        expect(await bz.keys()).to.deep.equal(['key1', 'key2', 'other']);
    });
});