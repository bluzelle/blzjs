import {APIAndSwarm, defaultGasParams, DEFAULT_TIMEOUT, sentryWithClient} from "../../../helpers/client-helpers";
import {useChaiAsPromised} from "../../../helpers/global-helpers";
import {expect} from 'chai';
import delay from "delay";


describe('getLease()', function () {
    this.timeout(DEFAULT_TIMEOUT);
    let bz: APIAndSwarm;

    beforeEach(() => sentryWithClient()
        .then(db => bz = db)
        .then(() => useChaiAsPromised())
    );

    it('should throw exception if key does not exist', () => {
        return expect(bz.getLease('key')).to.be.rejectedWith('unknown request: key not found');
    });

    it('should return the lease time left', () => {
        return bz.create('key', 'value', defaultGasParams(), {seconds: 30})
            .then(() => delay(20000))
            .then(() => bz.getLease('key'))
            .then(lease => expect(lease).to.be.lessThan(20));
    });
});