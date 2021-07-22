import {APIAndSwarm, DEFAULT_TIMEOUT, defaultGasParams, sentryWithClient} from "../../../helpers/client-helpers";
import {expect} from 'chai';
import {mnemonicToAddress} from "../../../../client/lib/API";


describe('account()', function(){
   this.timeout(DEFAULT_TIMEOUT);
   let bz: APIAndSwarm;

   beforeEach(() => sentryWithClient()
       .then(db => bz = db));

    it('should return account information', async () => {
        const account = await bz.account();

        expect(account.address).to.match(/bluzelle/);
        expect(account.address.length).to.be.greaterThan(20);
        expect(account.coins).to.have.length(1);
        expect(account.coins[0].denom).to.equal('ubnt');
        expect(account.account_number).to.be.a('string');
        expect(account.sequence).to.be.a('string');
    });

    it('should return the account information of the passed address', () => {
        const testAddress = mnemonicToAddress(bz.generateBIP39Account());
        return bz.transferTokensTo(testAddress, 1000, defaultGasParams())
            .then(() => Promise.all([bz.account(), bz.account(testAddress)]))
            .then(([a1, a2]) => {
                expect(a1.address).to.equal(bz.address);
                expect(a2.address).to.equal(testAddress);
                expect(a2.address).not.to.equal(bz.address);
                expect(a1.address).not.to.equal(testAddress)
            });
    });
});