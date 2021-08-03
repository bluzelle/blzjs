import {
    APIAndSwarm,
    createNewBzClient,
    DEFAULT_TIMEOUT,
    defaultGasParams,
    sentryWithClient
} from "../../../helpers/client-helpers";
import {useChaiAsPromised} from "../../../helpers/global-helpers";
import {expect} from "chai";

describe('upsert()', function () {
    this.timeout(DEFAULT_TIMEOUT);
    let bz: APIAndSwarm;

    beforeEach(() => sentryWithClient()
        .then(db => {
            bz = db
            useChaiAsPromised()
        })
    );

    it('should work with empty value', () => {
        return bz.upsert('key', 'value', defaultGasParams())
            .then(() => bz.read('key'))
            .then(value => expect(value).to.equal('value'))
            .then(() => bz.upsert('key', '', defaultGasParams()))
            .then(() => bz.read('key'))
            .then(value => expect(value).to.equal(''));
    });

    it('should resolve with txhash and height', () => {
        return bz.create('key', 'value', defaultGasParams())
            .then(() => bz.upsert('key', 'value', defaultGasParams())
                .then(tx => {
                    expect(tx).to.have.property('txhash')
                    expect(tx).to.have.property('height')
                })
            );
    });

    it('should update a value for a given key', () => {
        return bz.create('key', 'value', defaultGasParams())
            .then(() => bz.read('key'))
            .then(value => expect(value).to.equal('value'))
            .then(() => bz.upsert('key', 'anotherValue', defaultGasParams()))
            .then(() => bz.read('key'))
            .then(value => expect(value).to.equal('anotherValue'));
    });

    it('should create a key if it does not exist', () => {
        return bz.upsert('key', 'value', defaultGasParams())
            .then(() => bz.read('key'))
            .then(value => expect(value).to.equal('value'));
    });

    it('should only allow the original owner to update a key', () => {
        return createNewBzClient(bz)
            .then(bz2 =>
                bz.withTransaction(() => {
                    bz.upsert('key', 'value', defaultGasParams())
                    bz2.upsert('key', 'anotherValue', defaultGasParams())
                })
                    .catch(e => expect(e.error).to.equal('invalid request: Incorrect Owner: failed to execute message'))
            );
    });

    it('should work renewing with a shorter lease', () => {
        return bz.upsert('key', 'value', defaultGasParams())
            .then(() => bz.upsert('key', 'anotherValue', defaultGasParams(), {minutes: 10}))
            .then(() => bz.getLease('key'))
            .then(lease => expect(lease).to.equal(600));
    });
});