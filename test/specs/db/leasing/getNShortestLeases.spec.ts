import {APIAndSwarm, DEFAULT_TIMEOUT, defaultGasParams, sentryWithClient} from "../../../helpers/client-helpers";
import {expect} from 'chai';


describe('getNShortestLeases', function(){
    this.timeout(DEFAULT_TIMEOUT);
    let bz: APIAndSwarm;

    beforeEach(()=> sentryWithClient()
        .then(db => bz = db));

    it('should return the first 2 shortest leases', async() => {
        return Promise.all([
            bz.create('key1', 'value', defaultGasParams(), {days: 1}),
            bz.create('key2', 'value', defaultGasParams(), {hours: 1}),
            bz.create('key4', 'value', defaultGasParams(), {seconds: 30}),
            bz.create('key3', 'value', defaultGasParams(), {minutes: 1})
        ])
            // .then(() => bz.getNShortestLeases(2))
            // .then(result => expect(result.find(({key}) => key === 'key3')?.lease).to.be.closeTo(60, 12));
            // .then(result => expect(result.find(({key}) => key === 'key4')?.lease).to.be.closeTo(30, 12));
        const result = await bz.getNShortestLeases(2);

        expect(result.find(({key}) => key === 'key3')?.lease).to.be.closeTo(60, 12);
        expect(result.find(({key}) => key === 'key4')?.lease).to.be.closeTo(30, 12);
    })
});