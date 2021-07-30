import {
    APIAndSwarm,
    createKeys,
    DEFAULT_TIMEOUT,
    defaultGasParams,
    sentryWithClient
} from "../../../helpers/client-helpers";
import {expect} from "chai";

describe('txCount()', function () {
    this.timeout(DEFAULT_TIMEOUT);
    let bz: APIAndSwarm;

    beforeEach(() => sentryWithClient()
        .then(db => bz = db)
    );

    it('should return 0 if no keys', () => {
        return bz.txCount(defaultGasParams())
            .then(txs => expect(txs.count).to.equal(0));
    });

    it('should work with empty values', () => {
        return bz.withTransaction(() => {
            bz.create('key1', 'value1', defaultGasParams());
            bz.create('key2', '', defaultGasParams());
        })
            .then(() => bz.txCount(defaultGasParams()))
            .then(txs => expect(txs.count).to.equal(2));
    });

    it('should return the number of keys', () => {
        return createKeys(bz, 5)
            .then(() => bz.txCount(defaultGasParams()))
            .then(txs => expect(txs.count).to.equal(5))
            .then(() => bz.delete('key0', defaultGasParams()))
            .then(() => bz.txCount(defaultGasParams()))
            .then(txs => expect(txs.count).to.equal(4));
    });
})
;