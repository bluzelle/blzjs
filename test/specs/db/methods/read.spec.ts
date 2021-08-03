import {
    APIAndSwarm,
    createKeys,
    DEFAULT_TIMEOUT,
    defaultGasParams,
    sentryWithClient
} from "../../../helpers/client-helpers";
import {useChaiAsPromised} from "../../../helpers/global-helpers";
import {expect} from "chai";
import {bluzelle} from "../../../../client";

describe('read()', function () {
    this.timeout(DEFAULT_TIMEOUT);
    let bz: APIAndSwarm;

    beforeEach(() => sentryWithClient()
        .then(db => {
            bz = db
            useChaiAsPromised()
        })
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

    it('should work when the account has no transactions', () => {
        const bz2 = bluzelle({
            mnemonic: bz.generateBIP39Account(),
            uuid: bz.uuid,
            endpoint: bz.url
        });
        return bz.create('key', 'value', defaultGasParams())
            .then(() => bz2.read('key'))
            .then(value => expect(value).to.equal('value'));
    });

    it('should work when there is no mnemonic', () => {
        const bz2 = bluzelle({
            mnemonic: '',
            uuid: bz.uuid,
            endpoint: bz.url
        });
        return bz.create('key', 'value', defaultGasParams())
            .then(() => bz2.read('key'))
            .then(value => expect(value).to.equal('value'));
    });
});