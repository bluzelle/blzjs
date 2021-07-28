import {APIAndSwarm, DEFAULT_TIMEOUT, defaultGasParams, sentryWithClient} from "../../../helpers/client-helpers";
import {bluzelle, mnemonicToAddress} from "../../../../client";
import {expect} from 'chai';

describe('getBNT()', function () {
    this.timeout(DEFAULT_TIMEOUT);
    let bz: APIAndSwarm;
    let newAccount: APIAndSwarm;

    beforeEach(() => sentryWithClient()
        .then(db => bz = db)
        .then(() => newAccount = bluzelle({
                mnemonic: bz.generateBIP39Account(),
                uuid: bz.uuid,
                endpoint: bz.url
            })
        ));

    it('should return 0 if account has not been funded', () => {
        return newAccount.getBNT()
            .then(bnt => expect(bnt).to.equal(0));
    });

    it('should return the amount of BNT in an account', () => {
        return bz.transferTokensTo(newAccount.address, 10, defaultGasParams())
            .then(() => newAccount.getBNT())
            .then(bnt => expect(bnt).to.equal(10));
    });

    it('should return the right amount for ubnt', () => {
        return bz.transferTokensTo(newAccount.address, 10, defaultGasParams(), {ubnt: true})
            .then(() => newAccount.getBNT())
            .then(bnt => expect(bnt).to.equal(0))
            .then(() => newAccount.getBNT({ubnt: true}))
            .then(ubnt => expect(ubnt).to.equal(10));
    });

    it('should return the account information of the passed address', () => {
        const a = mnemonicToAddress(bz.generateBIP39Account());
        return bz.transferTokensTo(a, 1000, defaultGasParams())
            .then(() => Promise.all([bz.getBNT(), bz.getBNT({address: a})]))
            .then(([a1, a2]) => {
                expect(a1).to.be.greaterThan(1000);
                expect(a2).to.equal(1000);
            });
    });
});