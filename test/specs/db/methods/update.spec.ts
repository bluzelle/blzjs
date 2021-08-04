import {
    APIAndSwarm,
    createNewBzClient,
    DEFAULT_TIMEOUT,
    defaultGasParams,
    sentryWithClient
} from "../../../helpers/client-helpers";
import {useChaiAsPromised} from "../../../helpers/global-helpers";
import {expect} from "chai";
import {bluzelle} from "../../../../client";

describe('update()', function () {
    this.timeout(DEFAULT_TIMEOUT);
    let bz: APIAndSwarm;

    beforeEach(() => sentryWithClient()
        .then(db => {
            bz = db
            useChaiAsPromised()
        })
    );

    it('should work with empty value', () => {
        return bz.create('key', 'value', defaultGasParams())
            .then(() => bz.read('key'))
            .then(value => expect(value).to.equal('value'))
            .then(() => bz.update('key', '', defaultGasParams()))
            .then(() => bz.read('key'))
            .then(value => expect(value).to.equal(''));
    });

    it('should resolve with txhash and height', () => {
        return bz.create('key', 'value', defaultGasParams())
            .then(() => bz.update('key', 'anotherValue', defaultGasParams()))
            .then(tx => {
                expect(tx).to.have.property('txhash');
                expect(tx).to.have.property('height');
            });
    });

    it('should update a value for a given key', () => {
        return bz.create('key', 'value', defaultGasParams())
            .then(() => bz.read('key'))
            .then(value => expect(value).to.equal('value'))
            .then(() => bz.update('key', 'anotherValue', defaultGasParams()))
            .then(() => bz.read(('key')))
            .then(value => expect(value).to.equal('anotherValue'));
    });

    it('should throw error if key does not exist', () => {
        return bz.update('key', 'value', defaultGasParams())
            .catch(e => expect(e.error).to.equal('invalid request: Key does not exist: failed to execute message'));
    });

    it.skip('should charge if you increase the size of the data', async () => {
        const leaseRate10 = 2.9615511;
        const leaseRate20 = 2.7949135;

        await bz.create('foo1', 'a', defaultGasParams(), {days: 10});
        const baseUpdate = await bz.update('foo1', 'a'.repeat(1000), defaultGasParams(), {days: 20});

        await bz.create('foo2', 'a', defaultGasParams(), {days: 20});
        const update = await bz.update('foo2', 'a'.repeat(1000), defaultGasParams(), {days: 30});

        const calculateLeaseCost = (rate: number, days: number) =>
            Math.round(rate * days * (bz.uuid.length + 'foo2'.length + 1000 - 'a'.length))

        expect(baseUpdate.gasUsed - calculateLeaseCost(leaseRate10, 10))
            .to.equal(update.gasUsed - calculateLeaseCost(leaseRate20, 10))
    });

    it('should only allow the original owner to update a key', () => {
        return bz.create('key', 'value', defaultGasParams())
            .then(() => createNewBzClient(bz)
                .then(bz2 => bz2.update('key', 'anotherValue', defaultGasParams()))
                .catch(e => expect(e.error).to.equal('invalid request: Incorrect Owner: failed to execute message'))
            );
    });
});