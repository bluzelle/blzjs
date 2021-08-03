import {DEFAULT_TIMEOUT, defaultGasParams, sentryWithClient} from "../../../helpers/client-helpers";
import {expect} from "chai";
import {range} from "lodash";
import {passThroughAwait} from "promise-passthrough";
import {bluzelle} from "../../../../client";


// Ask Scott about this test
describe('high-load-text', function () {
    this.timeout(DEFAULT_TIMEOUT);

    // it('should store all of the keys', async () => {
    //     const bz = await sentryWithClient();
    //
    //     await bz.withTransaction(() =>
    //         range(0, 100).map(l => bz.create(`key${l}`, 'value'.repeat(l), defaultGasParams()))
    //     );
    //     await bz.withTransaction(() =>
    //         range(100000, 200000, 20000).map(l => bz.create(`key${l}`, 'value'.repeat(l), defaultGasParams()))
    //     );
    //
    //     const swarm2: Swarm | undefined | void = await bz.swarm?.export()
    //         .then(passThroughAwait(() => Swarm.stopDaemons(bz.swarm?.getSwarmConfig() || ({} as SwarmConfig))))
    //         .then(genesis =>
    //             new Swarm(bz.swarm?.getSwarmConfig() || ({} as SwarmConfig)).fork(genesis)
    //         )
    //
    //
    //     const bz2 = bluzelle({
    //         mnemonic: bz.mnemonic,
    //         endpoint: `http://localhost:${(swarm2 as Swarm).getSentries()[0].getRestPort()}`,
    //         uuid: bz.uuid
    //     })
    //     expect(await bz2.read('foo0')).to.equal('');
    //     expect(await bz2.read('foo20')).to.equal('x'.repeat(20))
    //     expect(await bz2.read('foo100000')).to.equal('x'.repeat(100000));
    // });
});