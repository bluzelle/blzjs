const reset = require('./reset');
const api = require('../src/api');
const assert = require('assert');
const {killSwarm} = require('../test-daemon/swarmSetup');


describe('reset', () => {

    beforeEach(reset);

    process.env.daemonIntegration && afterEach(killSwarm);

    beforeEach(() => api.connect(`ws://localhost:${process.env.port}`, '71e2cd35-b606-41e6-bb08-f20de30df76c'));

    it('can add a key', async () => {
        await api.create('myKey', 'abc');
        assert(await api.has('myKey'));
        assert(!await api.has('someOtherKey'));
    });

    it('should not have key from previous test', async () => {
        assert(!await api.has('myKey'));
    });

});
