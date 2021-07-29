import {DEFAULT_TIMEOUT, defaultGasParams, sentryWithClient} from "../../../helpers/client-helpers";
import {expect} from "chai";

describe('rename()', function () {
    this.timeout(DEFAULT_TIMEOUT);

    it('should rename a key', () => {
        return sentryWithClient()
            .then(bz => bz.withTransaction(() => {
                    bz.create('keyBefore', 'value', defaultGasParams());
                    bz.rename('keyBefore', 'keyAfter', defaultGasParams());
                })
                    .then(() => bz.txKeys(defaultGasParams()))
                    .then((results) => expect(results.keys).to.contain('keyAfter'))
            );
    });
});