import {
    APIAndSwarm,
    createKeys, createNewBzClient,
    DEFAULT_TIMEOUT,
    defaultGasParams,
    sentryWithClient
} from "../../../helpers/client-helpers";
import {expect} from "chai";
import {bluzelle} from "../../../../client";

describe('txKeys()', function () {
    this.timeout(DEFAULT_TIMEOUT);
    let bz: APIAndSwarm;

    beforeEach(() => sentryWithClient()
        .then(db => bz = db)
    );

    it('should return a empty list if there are no keys', () => {
        return bz.txKeys(defaultGasParams())
            .then(res => expect(res.keys).to.have.length(0));
    });

    it('should work with empty values', () => {
        return bz.withTransaction(() => {
            bz.create('key1', 'value', defaultGasParams());
            bz.create('key2', '', defaultGasParams());
        })
            .then(() => bz.txKeys(defaultGasParams()))
            .then(tx => expect(tx.keys).to.deep.equal(['key1', 'key2']));
    });

    it('should return a list of keys', () => {
        return createKeys(bz, 5)
            .then(() => bz.txKeys(defaultGasParams()))
            .then(tx => expect(tx.keys).to.deep.equal(['key0', 'key1', 'key2', 'key3', 'key4']));
    });

    it('should return keys that are not mine', () => {
        return createNewBzClient(bz)
            .then(bz2 => bz.withTransaction(() => {
                    bz.create('key1', 'value', defaultGasParams());
                    bz.create('key2', 'value', defaultGasParams());
                    bz2.create('otherKey', 'value', defaultGasParams());
                })
            )
            .then(() => bz.txKeys(defaultGasParams()))
            .then(tx => expect(tx.keys).to.deep.equal(['key1', 'key2', 'otherKey']));
    });
});