import {APIAndSwarm, DEFAULT_TIMEOUT, defaultGasParams, sentryWithClient} from "../../../helpers/client-helpers";
import {API, bluzelle} from '../../../../client';
import {useChaiAsPromised} from "../../../helpers/global-helpers";
import {expect} from "chai";

describe('transferTokensTo()', function () {
    this.timeout(DEFAULT_TIMEOUT);
    let bz: APIAndSwarm;
    let otherUser: API;

    beforeEach(() => sentryWithClient()
        .then(db => bz = db)
        .then(() => useChaiAsPromised())
        .then(() => otherUser = bluzelle({
                mnemonic: bz.generateBIP39Account(),
                endpoint: bz.url,
                uuid: bz.uuid
            })
        )
    );

    it('should transfer tokens to another account', () => {
        return bz.transferTokensTo(otherUser.address, 1, defaultGasParams())
            .then(() => otherUser.getBNT())
            .then(bnt => expect(bnt).to.equal(1))
            .then(() => bz.transferTokensTo(otherUser.address, 1000, defaultGasParams()))
            .then(() => otherUser.getBNT())
            .then(bnt => expect(bnt).to.equal(1001));
    });

    // Duplicate test to should return right amount of ubnt in getBNT() tests
    it('should transfer ubnt if the ubnt option is true', () => {
        return bz.transferTokensTo(otherUser.address, 10, defaultGasParams(), {ubnt: true})
            .then(() => otherUser.getBNT())
            .then(bnt => expect(bnt).to.equal(0))
            .then(() => otherUser.getBNT({ubnt: true}))
            .then(ubnt => expect(ubnt).to.equal(10));
    });
});