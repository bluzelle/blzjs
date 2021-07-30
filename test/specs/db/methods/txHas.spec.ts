import {APIAndSwarm, DEFAULT_TIMEOUT, defaultGasParams, sentryWithClient} from "../../../helpers/client-helpers";
import {expect} from "chai";

describe('txHas()', function () {
    this.timeout(DEFAULT_TIMEOUT);
    let bz: APIAndSwarm;

    beforeEach(() => sentryWithClient()
        .then(db => bz = db)
    );

    it('should return false if the key does not exist', () => {
        return bz.txHas('key', defaultGasParams())
            .then(tx => expect(tx).to.have.property('has', false));
    });

    it('should return true if key exists', () => {
        return bz.create('key', 'value', defaultGasParams())
            .then(() => bz.txHas('key', defaultGasParams()))
            .then(tx => expect(tx).to.have.property('has', true));
    });
});