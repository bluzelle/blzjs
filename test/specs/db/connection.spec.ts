import {APIAndSwarm, DEFAULT_TIMEOUT, sentryWithClient} from "../../helpers/client-helpers";
import {useChaiAsPromised} from "../../helpers/global-helpers";

describe('connection tests', function () {
    this.timeout(DEFAULT_TIMEOUT);
    let bz: APIAndSwarm;

    beforeEach(() => sentryWithClient()
        .then(db => {
            bz = db
            useChaiAsPromised()
        })
    );
    //Ask Scott about this test

    // it.skip('should allow for a large number of simultaneous connections', async function() {
    //         const CLIENT_COUNT = 5;
    //         const COUNT_KEYS = 5;
    //
    //         getBluzelleClient() === 'node' || this.skip();
    //         // TODO: This test does not work in browser or other proxies since generateBIP39Account is not async
    //         // and it gets node clients in the loop starting 'bluzelle()' anyway
    //
    //         console.log('Creating clients');
    //         const clients = times(CLIENT_COUNT, (n: number) => bluzelle({
    //             mnemonic: bz.generateBIP39Account(),
    //             uuid: Date.now().toString(),
    //             endpoint: bz.url
    //         }));
    //
    //         console.log('Funding clients');
    //         await bz.withTransaction(() => clients.forEach(client =>
    //             bz.transferTokensTo(client.address, COUNT_KEYS * 5, defaultGasParams({max_gas: 20000000}))
    //         ));
    //
    //         console.log('creating keys');
    //         await Promise.all(clients.map(client =>
    //             client.withTransaction(() =>
    //                 times(COUNT_KEYS, (n: number) =>
    //                     client.create(`my-key-${n}`, 'foo', defaultGasParams())
    //                 ))
    //             )
    //         );
    //
    //         console.log('verifying keys');
    //         await Promise.all(clients.map(client =>
    //             client.withTransaction(() =>
    //                 times(COUNT_KEYS, (n: number) =>
    //                     client.txRead(`my-key-${n}`, defaultGasParams())
    //                         .then((res: any) => expect(res.value).to.equal('foo'))
    //                 ))
    //             )
    //         )
    //     });
});