import {APIAndSwarm, DEFAULT_TIMEOUT, sentryWithClient} from "../../../helpers/client-helpers";
import {expect} from 'chai';
import {bluzelle} from "../../../../client";

describe('isExistingAccount()', function () {
    this.timeout(DEFAULT_TIMEOUT);
    let bz: APIAndSwarm;

    beforeEach(() => sentryWithClient()
        .then(db => bz = db)
    );

    it('should return true for an account that has transactions on the blockchain', () => {
        return bz.isExistingAccount()
            .then(accountExists => expect(accountExists).to.be.true);
    });

    it('should return false for an account that has no transactions in the blockchain', () => {
        const bz2 = bluzelle({
            mnemonic: bz.generateBIP39Account(),
            uuid: bz.uuid,
            endpoint: bz.url
        });

        return bz2.isExistingAccount()
            .then(accountExists => expect(accountExists).to.be.false);
    });
});