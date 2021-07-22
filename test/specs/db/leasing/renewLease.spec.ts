import {APIAndSwarm, DEFAULT_TIMEOUT, defaultGasParams, sentryWithClient} from "../../../helpers/client-helpers";
import {expect} from 'chai';


describe('renewLease', function(){
    this.timeout(DEFAULT_TIMEOUT);
    let bz: APIAndSwarm;

    beforeEach(() => sentryWithClient()
        .then(db => bz =db));

    it('should increase the lease time in days',() => {
        return bz.create('myKey', 'myValue', defaultGasParams(), {days: 1})
            .then(() => bz.getLease('myKey'))
            .then(lease => expect(lease).to.be.closeTo(86400, 12))
            .then(() => bz.renewLease('myKey', defaultGasParams(), {days: 2}))
            .then(() => bz.getLease('myKey'))
            .then(lease => expect(lease).to.be.closeTo(172800, 12));
    });


});