const reset = require('./reset');
const communication = require('../communication');
const api = require('../api');
const assert = require('assert');
const {killSwarm} = require('../test-daemon/swarmSetup');


describe('reset', () => {

    beforeEach(reset);

    process.env.daemonIntegration && afterEach(killSwarm);

    beforeEach(() => communication.connect(`ws://localhost:${process.env.port}`, '71e2cd35-b606-41e6-bb08-f20de30df76c'));

    it('can add a key', async () => {
        await communication.create('myKey', 'abc');
        assert(await communication.has('myKey'));
        assert(!await communication.has('someOtherKey'));
    });

    it('should not have key from previous test', async () => {
        assert(!await communication.has('myKey'));
    });

});
