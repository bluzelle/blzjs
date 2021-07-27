import {APIAndSwarm, DEFAULT_TIMEOUT, defaultGasParams, sentryWithClient} from "../../../helpers/client-helpers";
import {useChaiAsPromised} from "../../../helpers/global-helpers";
import {expect} from 'chai';
import delay from "delay";


describe('txGetLease()', function () {
    this.timeout(DEFAULT_TIMEOUT);
    let bz: APIAndSwarm;

    beforeEach(() => sentryWithClient()
        .then(db => bz = db)
        .then(() => useChaiAsPromised())
    );

    it('should throw exception if key does not exist', () => {
        return () => expect(bz.txGetLease('fake', defaultGasParams())).to.be.rejectedWith('unknown request: key does not exist');
    });

    it('should return the lease time left', () => {
        return bz.create('key', 'value', defaultGasParams(), {seconds: 30})
            .then(() => delay(20000))
            .then(() => bz.txGetLease('key', defaultGasParams()))
            .then(tx => expect(tx.lease).to.be.lessThan(12));
    });
});