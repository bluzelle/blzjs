import {DEFAULT_TIMEOUT, defaultGasParams, sentryWithClient} from "../../../helpers/client-helpers";
import {bluzelle, mnemonicToAddress} from "../../../../client";
import {expect} from 'chai';

describe('mint()', function () {
    this.timeout(DEFAULT_TIMEOUT);

    it('should mint tokens into provided account', async () => {
        const bz = await sentryWithClient();
        const newMnemonic = bz.generateBIP39Account();
        const newAccount = {
            mnemonic: newMnemonic,
            address: mnemonicToAddress(newMnemonic)
        };
        const bz2 = bluzelle({
            mnemonic: newAccount.mnemonic,
            endpoint: bz.url,
            uuid: bz.uuid
        });
        return bz.mint(newAccount.address, defaultGasParams())
            .then(() => bz2.getBNT())
            .then(bnt => expect(bnt).to.equal(2000));
    });
});