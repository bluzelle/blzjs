import {
    APIAndSwarm,
    createKeys,
    DEFAULT_TIMEOUT,
    defaultGasParams,
    sentryWithClient
} from "../../../helpers/client-helpers";
import {useChaiAsPromised} from "../../../helpers/global-helpers";
import {expect} from "chai";

describe('txread()', function () {
    this.timeout(DEFAULT_TIMEOUT);
    let bz: APIAndSwarm;

    beforeEach(() => sentryWithClient()
        .then(db => {
            bz = db
            useChaiAsPromised()
        })
    );

    it('should work with empty value', () => {
        return bz.create('key', '', defaultGasParams())
            .then(() => bz.txRead('key', defaultGasParams()))
            .then(tx => expect(tx).to.have.property('value', ''));
    });

    it('should retrieve values in order', () => {
        return Promise.all([
            bz.create('key', 'value', defaultGasParams()),
            bz.txRead('key', defaultGasParams()),
            bz.update('key', 'newValue', defaultGasParams()),
            bz.txRead('key', defaultGasParams())
        ])
            .then(results => {
                expect(results[1]?.value).to.equal('value');
                expect(results[3]?.value).to.equal('newValue');
            });
    });

    it('should retrieve a value from the store', () => {
        return bz.create('key', 'value', defaultGasParams())
            .then(() => bz.txRead('key', defaultGasParams()))
            .then(tx => expect(tx?.value).to.equal('value'));
    });

    it('should throw an error if key does not exist', () => {
        return bz.txRead('key', defaultGasParams())
            .catch(e => expect(e.error).to.equal('invalid request: Key does not exist: failed to execute message'));
    });

    //Rearrange/test
    it('should handle parallel reads', () => {
        return createKeys(bz, 3)
            .then(keys => Promise.all([
                    keys.map(key => bz.txRead(key, defaultGasParams()).then(x => x?.value))
                ])
            );
        // const {keys, values} = await createKeys(bz, 5);
        // expect(
        //     await Promise.all(keys.map(key => bz.txRead(key, defaultGasParams()).then(x => x?.value)))
        // ).to.deep.equal(values);
    });
});