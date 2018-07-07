const reset = require('./reset');
const api = require('../src/api');
const assert = require('assert');
const {despawnSwarm, swarm} = require('../test-daemon/setup');


describe('reset', () => {

    beforeEach(reset);

    process.env.daemonIntegration && afterEach(despawnSwarm);

    beforeEach(() => api.connect(`ws://localhost:${process.env.daemonIntegration ? swarm.list[swarm.leader] : 8100}`, '71e2cd35-b606-41e6-bb08-f20de30df76c'));

    it('can add a key', async () => {
        await api.create('myKey', 'abc');
        assert(await api.has('myKey'));
        assert(!await api.has('someOtherKey'));
    });

    it('should not have key from previous test', async () => {
        assert(!await api.has('myKey'));
    });

});
