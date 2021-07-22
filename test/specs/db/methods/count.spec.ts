import {APIAndSwarm, DEFAULT_TIMEOUT, sentryWithClient} from "../../../helpers/client-helpers";


describe('count()', function(){
    this.timeout(DEFAULT_TIMEOUT);
    let bz: APIAndSwarm;

    beforeEach(() => sentryWithClient()
        .then(db => bz = db));
});