import {
    APIAndSwarm,
    createKeys,
    DEFAULT_TIMEOUT,
    defaultGasParams,
    sentryWithClient
} from "../../../helpers/client-helpers";
import {expect} from 'chai';

describe('keyValues()', function () {
    this.timeout(DEFAULT_TIMEOUT);
    let bz: APIAndSwarm;

    beforeEach(() => sentryWithClient()
        .then(db => bz = db)
    );

    it('should work with empty values', () => {
        return bz.withTransaction(() => {
            bz.create('key1', 'value', defaultGasParams());
            bz.create('key2', '', defaultGasParams());
        })
            .then(() => bz.keyValues())
            .then(keyValues => expect(keyValues).to.deep.equal([{
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
            .then(() => bz.keyValues())
            .then(keyValues => expect(JSON.parse(keyValues[0].value)).to.deep.equal({value: 10}));
    });

    it('should return an empty array if there are no keys', () => {
        return bz.keyValues()
            .then(keyValues => expect(keyValues).to.have.length(0));
    });

    it('should return keys and values', async () => {
        const count = 5;
        const inPairs: { keys: string[], values: string[] } = await createKeys(bz, count);

        const expectedResults = inPairs.keys.reduce((memo: any[], key, idx) => {
                memo.push({key, value: inPairs.values[idx]})
                return memo
            }, []
        );
        expect(await bz.keyValues()).to.deep.equal(expectedResults);
    });
});