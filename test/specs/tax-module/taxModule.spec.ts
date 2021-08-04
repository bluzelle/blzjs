import {describe} from "mocha";
import {APIAndSwarm, DEFAULT_TIMEOUT, defaultGasParams, sentryWithClient} from "../../helpers/client-helpers";
import {passThrough, passThroughAwait} from "promise-passthrough";
import {bluzelle} from "../../../client";
import {expect} from "chai";

let collector: APIAndSwarm;
describe('tax module', function () {
    this.timeout(DEFAULT_TIMEOUT);
    let bz: APIAndSwarm;

    beforeEach(() => sentryWithClient()
        .then(db => bz = db)
        .then(passThrough(bz => collector = createCollector(bz)))
        .then(passThroughAwait(bz => bz.transferTokensTo(collector.address, 1000, defaultGasParams())))
    );

    it('should be able to set the tax rate', () => {
        return setTaxRate(collector, 76, 5)
            .then(() => bz.taxInfo())
            .then(info => {
                expect(info).to.have.property('FeeBp', '76');
                expect(info).to.have.property('TransferBp', '5');
            })
    });

    it('should throw an error if a non-collector tries to set tax rate', () => {
        return setTaxRate(bz, 76, 5)
            .catch((e) =>
                expect(e.error).to.equal('invalid pubkey: pubKey does not match signer address bluzelle1wjkdcz4hl4gcarnqtupu7vkftal6h34qxjh6rw with signer index: 0'))
    });

    it('should throw an error if a non-collector reassigns tax collector', () => {
        return createUser(bz)
            .then(newCollector => setTaxCollectorUser(bz, newCollector)
                .catch((e) =>
                    expect(e.error).to.equal('invalid pubkey: pubKey does not match signer address bluzelle1wjkdcz4hl4gcarnqtupu7vkftal6h34qxjh6rw with signer index: 0'))
            );
    });

    it('should transfer tax rates if new tax collector is set', () => {
        return createUser(bz)
            .then(newCollector => setTaxRate(collector, 76, 5)
                .then(() => setTaxCollectorUser(collector, newCollector))
                .then(() => bz.taxInfo())
                .then(response => {
                    expect(response.Collector).to.equal(newCollector.address)
                    expect(response.FeeBp).to.equal("76")
                    expect(response.TransferBp).to.equal("5")
                })
            );
    });
});

const setTaxCollectorUser = (bz: APIAndSwarm, newCollector: APIAndSwarm): Promise<unknown> =>
    bz.sendMessage({
            type: 'tax/collector',
            value: {
                NewCollector: newCollector.address,
                Proposer: collector.address
            }
        }
        , defaultGasParams())

const createUser = (bz: APIAndSwarm): Promise<APIAndSwarm> =>
    Promise.resolve({
        mnemonic: bz.generateBIP39Account(),
        uuid: bz.uuid,
        endpoint: bz.url
    })
        .then(bluzelle)
        .then(passThroughAwait(newBz => bz.transferTokensTo(newBz.address, 1000, defaultGasParams())));

const createCollector = (bz: APIAndSwarm): APIAndSwarm =>
    bluzelle({
        mnemonic: "day rabbit mom clown bleak brown large lobster reduce accuse violin where address click dynamic myself buyer daughter situate today wheel thumb sudden drill",
        uuid: bz.uuid,
        endpoint: bz.url
    });

const setTaxRate = (bz: APIAndSwarm, fee: number, transfer: number): Promise<unknown> =>
    bz.sendMessage({
            type: "tax/bp",
            value: {
                NewFeeBp: fee.toString(),
                NewTransferBp: transfer.toString(),
                Proposer: 'bluzelle1wjkdcz4hl4gcarnqtupu7vkftal6h34qxjh6rw'
            }
        }
        , defaultGasParams());