import {APIAndSwarm, DEFAULT_TIMEOUT, defaultGasParams, sentryWithClient} from "../../../helpers/client-helpers";
import {expect} from "chai";

describe('query()', function (){
    this.timeout(DEFAULT_TIMEOUT);
    let bz: APIAndSwarm;

    beforeEach(() => sentryWithClient()
        .then(db => bz = db)
    );

    it('should send a query to Curium', () => {
        return bz.create('key', 'value', defaultGasParams())
            .then(() => bz.query<{value: string}>('crud/read/uuid/key'))
            .then(({value}) => expect(value).to.equal('value'));
    });
});