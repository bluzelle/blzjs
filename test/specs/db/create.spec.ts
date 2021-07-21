import {APIAndSwarm, defaultGasParams, sentryWithClient} from "../../helpers/client-helpers";
import {expect} from 'chai';

describe('create()', function (){
    this.timeout(400000);
    let bz: APIAndSwarm;

    beforeEach(() => sentryWithClient()
        .then(x => bz = x));

    it("create()", ()=>{
        return bz.create('key', 'value', defaultGasParams())
            .then(() => bz.read('key'))
            .then(val => expect(val).to.equal('value'))
    })
})