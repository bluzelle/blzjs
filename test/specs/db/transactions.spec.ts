import {APIAndSwarm, createKeys, DEFAULT_TIMEOUT, defaultGasParams, sentryWithClient} from "../../helpers/client-helpers";
import {useChaiAsPromised} from "../../helpers/global-helpers";
import {expect} from "chai";

describe('transactions', function () {
    this.timeout(DEFAULT_TIMEOUT);
    let bz: APIAndSwarm;

    beforeEach(() => sentryWithClient()
        .then(db => {
            bz = db
            useChaiAsPromised()
        })
    );

    it('should put a single message in a transaction by default', () => {
        return Promise.all([
            bz.create('foo', 'bar', defaultGasParams()),
            bz.create('foo2', 'bar', defaultGasParams())
        ])
            .then(results => expect(results[0].txhash).not.to.equal(results[1].txhash));
    });

    it('should recover if a transaction fails', () => {
        return Promise.all([
            bz.create('key1', 'value', defaultGasParams()),
            bz.create('key2', 'value', defaultGasParams()),
            bz.create('key3', 'value', defaultGasParams()),
        ])
            .then(() => Promise.all([
                    bz.txRead('key1', defaultGasParams()),
                    bz.txRead('key2', defaultGasParams()),
                    bz.create('key1', 'anotherValue', defaultGasParams())
                        .catch(e => ({value: 'error'})),
                    bz.txRead('key3', defaultGasParams())
                ])
                    .then(results => expect(results.map(it => (it as any)?.value)).to.deep.equal(['value', 'value', 'error', 'value']))
            );
    });

    describe('withTransaction()', function () {

        it('it will operate transactionally', () => {
            return bz.withTransaction(() => {
                bz.create('key', 'value', defaultGasParams())
                bz.txRead('fakeKey', defaultGasParams())
            })
                .catch(e => expect(e.error).to.equal('invalid request: Key does not exist: failed to execute message'))
                .then(() => expect(bz.read('key')).to.be.rejectedWith('unknown request: key not found'));
        });

        it('should handle a large number of messages in a transaction', () => {
            return createKeys(bz, 1000)
                .then(pairs => bz.withTransaction(() =>
                        pairs.keys.forEach(key => bz.txRead(key, defaultGasParams()))
                    )
                        .then(response => response.data.map((it: any) => it.value))
                        .then(vs => expect(vs).to.deep.equal(pairs.values))
                );
        });
    });
});