import {DEFAULT_TIMEOUT} from "../../helpers/client-helpers";

describe('Daemon', function () {
    this.timeout(DEFAULT_TIMEOUT);

    describe('setupGenesis', () => {

        //Ask Scott, cannot find the daemon-manager/lib/Daemon
        // it('should update the community_tax parameters', async () => {
        //     const daemon: Daemon = await getSentry();
        //     const genesis = await daemon.readJsonFile('.blzd/config/genesis.json');
        //     expect(genesis.app_state.distribution.params.community_tax).to.equal("0.000100000000000000");
        // });
    });

    describe('log()', () => {
        //     it('should call a callback function with log data for the daemon', (done) => {
        //         getSentry()
        //             .then(daemon => daemon.log((data: string) => {
        //                     if (data.includes('Executed block')) {
        //                         daemon.stop()
        //                             .then(() => done())
        //                     }
        //                 })
        //             );
        //     });
    });

    describe('save()', () => {
        //     it('should save daemon container as image', () =>
        //         getSentry()
        //             .then(daemon => daemon.save(`${daemon.getName()}`)))
        // });
        //
        // describe('save() validator', () => {
        //     it('should save container as image', () =>
        //         getValidator()
        //             .then(daemon => daemon.save(`${daemon.getName()}`))
        //     )
    });
});