import {describe} from "mocha";
import {APIAndSwarm, DEFAULT_TIMEOUT, sentryWithClient} from "../../helpers/client-helpers";
import delay from "delay";
import {bluzelle, mnemonicToAddress} from "../../../client";
import {expect} from "chai";

describe('faucet', function () {
    this.timeout(DEFAULT_TIMEOUT);
    let bz: APIAndSwarm;

    beforeEach(() => sentryWithClient()
        .then(db => bz = db)
    );

    it('should return a new account if called without one', () => {
        return delay(1000)
            .then(() =>
                fetch(`${bz.url}/mint`)
                    .then(response => response.json())
                    .then(result => bluzelle({
                        mnemonic: result.mnemonic,
                        uuid: bz.uuid,
                        endpoint: bz.url
                    }))
                    .then(bz2 => bz2.getBNT())
                    .then(bnt => expect(bnt).to.equal(2000))
            );
    });

    it('should add tokens to an existing account', () => {
        const mnemonic = bz.generateBIP39Account();
        const address = mnemonicToAddress(mnemonic);
        return delay(10000)
            .then(() => bz.transferTokensTo(address, 1000, {gas_price: 0.002, max_gas: 10000000}))
            .then(() => fetch(`${bz.url}/mint/${address}`)
                .then(() => bluzelle({
                    mnemonic: mnemonic,
                    uuid: bz.uuid,
                    endpoint: bz.url
                }))
            )
            .then(bz2 => bz2.getBNT())
            .then(bnt => expect(bnt).to.equal(3000));
    });

    it('should not add tokens a second time when requests are made back to back', async () => {
        const mnemonic = bz.generateBIP39Account();
        const address = mnemonicToAddress(mnemonic);
        const bz2 = bluzelle({
            mnemonic: mnemonic,
            uuid: bz.uuid,
            endpoint: bz.url
        })
        return delay(1000)
            .then(() => bz.transferTokensTo(address, 1000, {gas_price: 0.002, max_gas: 10000000}))
            .then(() => fetch(`${bz.url}/mint/${address}`)
                .then(() => bz2.getBNT())
                .then(bnt => expect(bnt).to.equal(3000))
                .then(() => fetch(`${bz.url}/mint/${address}`))
                .then(() => bz2.getBNT())
                .then(bnt => expect(bnt).to.equal(5000))
            );
    });
});