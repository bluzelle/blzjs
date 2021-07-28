import {APIAndSwarm, DEFAULT_TIMEOUT, defaultGasParams, sentryWithClient} from "../../../helpers/client-helpers";
import {expect} from 'chai';

describe('getTx()', function () {
    this.timeout(DEFAULT_TIMEOUT);
    let bz: APIAndSwarm;

    beforeEach(() => sentryWithClient()
        .then(db => bz = db)
    );

    it('should return transaction info', () => {
        return bz.create('key', 'value', defaultGasParams())
            .then(x => x.txhash)
            .then(bz.getTx.bind(bz))
            .then((x: any) => x.tx.value.msg[0].value)
            .then(tx => {
                expect(tx.UUID).to.equal('uuid');
                expect(tx.Key).to.equal('key');
                expect(tx.Value).to.equal('value');
            });
    });
});