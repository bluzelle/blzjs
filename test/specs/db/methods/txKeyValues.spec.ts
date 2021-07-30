import {
    APIAndSwarm,
    createKeys,
    DEFAULT_TIMEOUT,
    defaultGasParams,
    sentryWithClient
} from "../../../helpers/client-helpers";
import {expect} from "chai";

describe('txKeysValues()', function () {
    this.timeout(DEFAULT_TIMEOUT);
    let bz: APIAndSwarm;

    beforeEach(() => sentryWithClient()
        .then(db => bz = db)
    );

    it('should be able to handle empty values', () => {
        return bz.withTransaction(() => {
            bz.create('key1', 'value', defaultGasParams());
            bz.create('key2', '', defaultGasParams());
        })
            .then(() => bz.txKeyValues(defaultGasParams()))
            .then(tx => expect(tx.keyvalues).to.deep.equal([{
                    key: 'key1',
                    value: 'value'
                }, {
                    key: 'key2',
                    value: ''
                }])
            );
    });

    it('should be able to store json', () => {
        return bz.create('key', JSON.stringify({value: 10}), defaultGasParams())
            .then(() => bz.txKeyValues(defaultGasParams()))
            .then(tx => expect(JSON.parse(tx.keyvalues[0].value)).to.deep.equal({value: 10}));
    });

    it('should return an empty array if there are no keys', () => {
        return bz.txKeyValues(defaultGasParams())
            .then(tx => expect(tx.keyvalues).to.have.length(0));
    });

    it('should return keys and values', () => {
        return createKeys(bz, 3)
            .then(() => bz.txKeyValues(defaultGasParams()))
            .then(tx => {
                expect(tx.keyvalues).to.have.length(3);
                expect(tx.keyvalues).to.deep.equal([
                    {
                        "key": "key0",
                        "value": "value"
                    },
                    {
                        "key": "key1",
                        "value": "value"
                    },
                    {
                        "key": "key2",
                        "value": "value"
                    }
                ]);
            });
    });
});