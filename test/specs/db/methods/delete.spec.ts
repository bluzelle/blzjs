import {APIAndSwarm, DEFAULT_TIMEOUT, defaultGasParams, sentryWithClient} from "../../../helpers/client-helpers";
import {useChaiAsPromised} from "../../../helpers/global-helpers";
import {expect} from 'chai';

describe('delete()', function () {
    this.timeout(DEFAULT_TIMEOUT);
    let bz: APIAndSwarm;

    beforeEach(() => sentryWithClient()
        .then(db => bz = db)
        .then(() => useChaiAsPromised())
    );

    it('should resolve to chain information', () => {
        return bz.create('key', 'value', defaultGasParams())
            .then(() => bz.delete('key', defaultGasParams()))
            .then(result => {
                expect(result.txhash).to.be.a('string');
                expect(result.height).to.be.a('number');
            });
    });

    it('should delete a key in the database', () => {
        return bz.create('key', 'value', defaultGasParams())
            .then(() => bz.read('key'))
            .then(value => expect(value).to.equal('value'))
            .then(() => bz.delete('key', defaultGasParams()))
            .then(() => expect(bz.read('key')).to.be.rejectedWith('key not found'));


        // expect(await bz.read('key')).to.equal('value');
        // await bz.delete('key', defaultGasParams());
        // await expect(bz.read('key')).to.be.rejectedWith(Error, /key not found/);
    });
});