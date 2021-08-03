import {
    APIAndSwarm,
    createKeys,
    DEFAULT_TIMEOUT,
    defaultGasParams,
    sentryWithClient
} from "../../../helpers/client-helpers";
import {useChaiAsPromised} from "../../../helpers/global-helpers";
import {expect} from "chai";
import {keys} from "lodash";

describe('multiUpdate()', function () {
    this.timeout(DEFAULT_TIMEOUT);
    let bz: APIAndSwarm;

    beforeEach(() => sentryWithClient()
        .then(db => {
            bz = db
            useChaiAsPromised()
        })
    );

    it('should throw an error if a key does not exist', () => {
        return bz.multiUpdate([{key: 'key1', value: 'value'}, {key: 'key2', value: 'value'}], defaultGasParams())
            .catch(e => expect(e.error).to.match(/Key does not exist/));
    });

    it('should work with empty values', () => {
        return bz.withTransaction(() => {
            bz.create('key1', 'firstValue', defaultGasParams());
            bz.create('key2', '', defaultGasParams());
        })
            .then(() => bz.multiUpdate([{key: 'key1', value: ''}, {
                key: 'key2',
                value: 'secondValue'
            }], defaultGasParams()))
            .then(() => bz.read('key1'))
            .then(firstValue => expect(firstValue).to.equal(''))
            .then(() => bz.read('key2'))
            .then(secondValue => expect(secondValue).to.equal('secondValue'));
    });

    it('should not update any keys if one of the keys fail', () => {
        return bz.create('key', 'value', defaultGasParams())
            .then(() => bz.read('key'))
            .then(value => expect(value).to.equal('value'))
            .then(() => bz.multiUpdate([{key: 'key', value: 'secondValue'}, {
                key: 'key2',
                value: 'secondValue'
            }], defaultGasParams()))
            .catch(e => expect(e.error).to.equal('invalid request: Key does not exist [1]: failed to execute message'))
            .then(() => bz.read('key'))
            .then(value => expect(value).to.equal('value'));
    });

    it('should update a value in the store', () => {
        return bz.create('key', 'value', defaultGasParams())
            .then(() => bz.multiUpdate([{key: 'key', value: 'secondValue'}], defaultGasParams()))
            .then(() => bz.read('key'))
            .then(value => expect(value).to.equal('secondValue'));
    });

    it('should update multiple values in a store', () => {
        return createKeys(bz, 3)
            .then(() => bz.multiUpdate([{
                    key: 'key0', value: 'newValue'
                }, {
                    key: 'key2', value: 'newValue'
                }], defaultGasParams())
            )
            .then(() => bz.read('key0'))
            .then(value => expect(value).to.be.equal('newValue'))
            .then(() => bz.read('key1'))
            .then(value => expect(value).to.equal('value'))
            .then(() => bz.read('key2'))
            .then(value => expect(value).to.be.equal('newValue'));
    });
});