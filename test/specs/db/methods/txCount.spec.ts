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
//Working on this test, have to go back and refactor createKeys
    it('should return the number of keys', () => {
        return createKeys(bz, 5)
            .then((pairs = {keys: [], values: []}) => {
                    bz.txCount(defaultGasParams())
                        .then(txs => expect(txs.count).to.equal(0));
                    bz.delete(pairs.keys[0], defaultGasParams());
                }
            )
            .then(() => bz.txCount(defaultGasParams()))
            .then(txs => expect(txs.count).to.equal(0));

        // expect(await bz.txCount(defaultGasParams()).then(x => x.count)).to.equal(5);
        // await bz.delete(keys[0], defaultGasParams());
        // expect(await bz.txCount(defaultGasParams()).then(x => x.count)).to.equal(4);
    });
});