import {describe} from "mocha";
import {APIAndSwarm, DEFAULT_TIMEOUT, defaultGasParams, sentryWithClient} from "../../helpers/client-helpers";
import {passThrough, passThroughAwait} from "promise-passthrough";
import {bluzelle, GasInfo} from "../../../client";
import {expect} from "chai";

let collector: APIAndSwarm;
let bz: APIAndSwarm;

describe('tax module', function () {
    this.timeout(DEFAULT_TIMEOUT);

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

    it('should transfer the correct amounts during a transfer', async () => {
        const alice = await createUser(bz);
        const bob = await createUser(bz);

        await setTaxRate(collector, feeTax, transferTax);

        const aliceBefore = await getUbnt(alice);
        const bobBefore = await getUbnt(bob);

        const TRANSFER = 100

        const collectorBefore = await getUbnt(collector);

        await alice.transferTokensTo(bob.address, TRANSFER, defaultGasParams());

        const aliceAfter = await getUbnt(alice);
        const collectorAfter = await getUbnt(collector);

        const taxCollected = collectorAfter - collectorBefore
        expect(taxCollected).to.equal(calculateFeeTax() + calculateTransferTax(TRANSFER));

        expect(await getUbnt(bob)).to.equal(bobBefore + inUbnt(TRANSFER));

        const totalCharged = calculateTransferTax(TRANSFER) + inUbnt(TRANSFER) + standardGasCost();
        expect(aliceAfter + totalCharged).to.equal(aliceBefore);
    });

    it('faucet should only charge fee tax', async () => {
        const alice = await createUser(bz);
        const userBefore = await getUbnt(bz);
        const collectorBefore = await getUbnt(collector)
        const aliceBefore = await getUbnt(alice);

        await bz.mint(alice.address, defaultGasParams());

        expect(await getUbnt(alice)).to.equal(aliceBefore + inUbnt(2000));

        expect(await getUbnt(bz)).to.equal(userBefore - standardGasCost());

        expect(await getUbnt(collector)).to.equal(collectorBefore + calculateFeeTax());
    });

    it('should not charge transfer tax when delegating', async () => {
        const alice = await createUser(bz);
        const collectorBefore = await getUbnt(collector)
        const aliceBefore = await getUbnt(alice);

        await delegate(alice, 10)
            .then(x => x)
            .then(() => getUbnt(alice))
            .then(aliceAfter =>
                expect(aliceBefore - standardGasCost() - inUbnt(10)).to.equal(aliceAfter)
            );

        await getUbnt(collector)
            .then(collectorAfter =>
                expect(collectorBefore + calculateFeeTax()).to.equal(collectorAfter)
            );
    });

    it('should charge only fee tax during unbonding', async () => {
        const TRANSFER = 100;
        const alice = await createUser(bz);
        await delegate(alice, TRANSFER);

        const aliceBefore = await getUbnt(alice);
        const collectorBefore = await getUbnt(collector);

        await undelegate(alice, 10)

        await getUbnt(collector)
            .then(collectorAfter =>
                expect(collectorBefore + calculateFeeTax()).to.equal(collectorAfter)
            );

        await getUbnt(alice)
            .then(aliceAfter => expect(aliceBefore - standardGasCost()).to.equal(aliceAfter));
    });

    it('should charge only fee tax when getting validator rewards', async () => {
        await delegate(bz, 1000);
        const userBefore = await getUbnt(bz);
        const collectorBefore = await getUbnt(collector);

        const userRewards = await withdrawRewards(bz)

        expect(await getUbnt(bz)).to.equal(userBefore + userRewards - standardGasCost());
        expect(await getUbnt(collector)).to.equal(collectorBefore + calculateFeeTax());
    });

    it('should charge only fee tax when two users transfer to each other', async () => {
        const amountDelegated = 100;
        const transferAmount = 80;

        const alice = await createUser(bz);
        const bob = await createUser(bz);
        const charlie = await createUser(bz);

        const aliceBefore = await getUbnt(alice);
        const collectorBefore = await getUbnt(collector);

        await delegate(alice, amountDelegated);
        await bob.transferTokensTo(charlie.address, transferAmount, defaultGasParams());

        const aliceRewards = await withdrawRewards(alice);
        expect(aliceRewards).to.be.greaterThan(0);

        expect(await getUbnt(alice)).to.equal(aliceBefore + aliceRewards - (standardGasCost() * 2) - inUbnt(amountDelegated));
        expect(await getUbnt(collector)).to.equal(collectorBefore + (calculateFeeTax() * 3) + calculateTransferTax(transferAmount));
    });

    it('should collect only the fee tax from proposals', async () => {
        const alice = await createUser(bz);
        const bob = await createUser(bz);

        const aliceBefore = await getUbnt(alice);
        const bobBefore = await getUbnt(bob);
        const collectorBefore = await getUbnt(collector);

        const proposalId = await alice.createProposal(10, 'alice title', 'alice description', defaultGasParams())
            .then(x => x.id);

        await bob.depositToProposal(proposalId, 20, 'bob title', 'bob description', defaultGasParams());

        expect(await getUbnt(alice)).to.equal(aliceBefore - standardGasCost() - inUbnt(10));
        expect(await getUbnt(bob)).to.equal(bobBefore - standardGasCost() - inUbnt(20));
        expect(await getUbnt(collector)).to.equal(collectorBefore + (calculateFeeTax() * 2));
    });
});

const feeTax = 100;
const transferTax = 1;
const inUbnt = (bnt: number): number => bnt * 1000000;
const getUbnt = (bz: APIAndSwarm): Promise<number> => bz.getBNT({ubnt: true});
const calculateFeeTax = (gasInfo: GasInfo = {}) => standardGasCost(gasInfo) * (feeTax / 10000)
const calculateTransferTax = (transfer: number) => inUbnt(transfer) * (transferTax / 10000)
const standardGasCost = (gasInfo: GasInfo = {}) => (defaultGasParams(gasInfo).gas_price as number) * (defaultGasParams(gasInfo).max_gas as number);

const withdrawRewards = (bz: APIAndSwarm) =>
    getValoper()
        .then(valoper => bz.withdrawRewards(valoper, defaultGasParams()))

const undelegate = (bz: APIAndSwarm, amount: number) =>
    getValoper()
        .then(valoper => bz.undelegate(valoper, amount, defaultGasParams()));

const delegate = (bz: APIAndSwarm, amount: number) =>
    getValoper()
        .then(valoper => bz.delegate(valoper, amount, defaultGasParams()));

const getValoper = (): Promise<string> =>
    (bz as any).swarm.exec('wget -q -O - http://localhost:26657/genesis')
        .then((x: any) => x.result.genesis.app_state.genutil.gentxs[0].value.msg[0].value.validator_address)

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

/*
// To delegate
blzcli tx staking delegate `blzcli keys show testnetpub0 --bech val | jq -r '.address'` 1976000000000ubnt --gas-prices 0.002ubnt --gas=auto --gas-adjustment=1.4 --from community --node https://client.sentry.testnet.public.bluzelle.com:26657

How to claim staking rewards (any delegator can call this):
blzcli tx distribution withdraw-rewards bluzellevaloper1ctr24z5q77aeg9qd6daw9dgrs4uk2fjuzm27r3 --from testnetpub0 --gas-prices 0.002ubnt --gas=auto --gas-adjustment=2.0 --chain-id bluzelle-testnet-public-9 --node https://client.sentry.testnet.public.bluzelle.com:26657

How to get a validator’s commission rate:
blzcli q staking validator bluzellevaloper1ctr24z5q77aeg9qd6daw9dgrs4uk2fjuzm27r3 --node https://client.sentry.testnet.public.bluzelle.com:26657 | jq '.commission'


How to get the amount of staking rewards that are owed (and therefore claimable) by a delegator (the delegator could be the validator itself):
blzcli q distribution rewards bluzelle1ctr24z5q77aeg9qd6daw9dgrs4uk2fjuzkerx8 bluzellevaloper1ctr24z5q77aeg9qd6daw9dgrs4uk2fjuzm27r3 --node https://client.sentry.testnet.public.bluzelle.com:26657 | jq

// To unbond
blzcli tx staking unbond `blzcli q staking validators --node https://client.sentry.testnet.public.bluzelle.com:26657 | jq '.[] | select(.description.moniker == "Zbwx")' | jq ".operator_address" | tr -d '"'` `expr 10000000 \* 1000000`ubnt --gas-prices 0.002ubnt --gas=auto --gas-adjustment=1.4 --from testnetpub0 --node https://client.sentry.testnet.public.bluzelle.com:26657

How to get a validator’s commission reward available to be claimed:
blzcli q distribution commission bluzellevaloper1ctr24z5q77aeg9qd6daw9dgrs4uk2fjuzm27r3 --node https://client.sentry.testnet.public.bluzelle.com:26657 | jq

// Create a proposal
ssh -f -L 26657:127.0.0.1:26657 -i ~/Desktop/curium/testnetpublic.pem ubuntu@a.gateway.sentry.testnet.public.bluzelle.com sleep 2; blzcli tx gov submit-proposal -y --title="Batman Proposal #1" --description="My SuperHero #1" --type="Text" --deposit="10ubnt" --from testnetpub0 --gas-prices 0.002ubnt --gas=auto --gas-adjustment=1.4 --node tcp://localhost:26657

// Add deposit to proposal
ssh -f -L 26657:127.0.0.1:26657 -i ~/Desktop/curium/testnetpublic.pem ubuntu@a.gateway.sentry.testnet.public.bluzelle.com sleep 2; blzcli tx gov deposit 7 1000000000ubnt -y --from testnetpub0 --gas-prices 0.002ubnt --gas=auto --gas-adjustment=1.4 --node tcp://localhost:26657


        - Get tax rates
        - Get balance of user0 and TaxMan.
        - Re-delegate some amount of tokens from validator0 to validator1
        - Ensure that user0 and TaxMan's new balances is as expected. No transfer tax. Only fee tax.

 */