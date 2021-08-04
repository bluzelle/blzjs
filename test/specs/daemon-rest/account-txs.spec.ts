import {APIAndSwarm, DEFAULT_TIMEOUT, defaultGasParams, sentryWithClient} from "../../helpers/client-helpers";
import {expect} from "chai";
import {bluzelle} from "../../../client";
import {times} from "lodash";

describe('/account-txs rest endpoint', function () {
    this.timeout(DEFAULT_TIMEOUT);
    let bz: APIAndSwarm;

    beforeEach(() => sentryWithClient()
        .then(db => bz = db)
    );

    it('should return an empty array if there are no matching transactions', () => {
        return fetch(`${bz.url}/account-txs/fake-address/1`)
            .then(x => x.json())
            .then(x => expect(x).to.deep.equal([]));
    });

    it('should return the number of matching transfers given the recipient and starting block', () =>
        testTransactions(bz, 2)
    );

    it('should work with just under 100 transfers', () =>
        testTransactions(bz, 99)
    );

    it('should work with 100 transfers', () =>
        testTransactions(bz, 100)
    );

    it('should work with more than 100 transfers', () =>
        testTransactions(bz, 110)
    );
});

const testTransactions = (bz: APIAndSwarm, numOfTransfers: number) => {
    const senders = times(numOfTransfers).map(() => bluzelle({
        mnemonic: bz.generateBIP39Account(),
        uuid: bz.uuid,
        endpoint: bz.url
    }))
    const recipient = bluzelle({
        mnemonic: bz.generateBIP39Account(),
        uuid: bz.uuid,
        endpoint: bz.url
    });

    bz.setMaxMessagesPerTransaction(200);
    return bz.withTransaction<Promise<any>>(() => Promise.all(senders.map(sender =>
        bz.transferTokensTo(sender.address, 50, defaultGasParams())
    )))
        .then(() => Promise.all(senders.map(sender => sender.transferTokensTo(recipient.address, 1, defaultGasParams()))))
        .then(() => fetch(`${bz.url}/account-txs/${recipient.address}/1`))
        .then(x => x.json())
        .then(x => expect(x.length).to.equal(numOfTransfers));
}