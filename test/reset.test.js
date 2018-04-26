const reset = require('./reset');
const communication = require('../communication');
const api = require('../api');
const assert = require('assert');


describe('reset', () => {

    beforeEach(reset);

    beforeEach(() => {
        communication.connect('ws://localhost:8100', '71e2cd35-b606-41e6-bb08-f20de30df76c');
    });

    it('can add a key', async () => {
        await communication.create('myKey', 'abc');
        assert(await communication.has('myKey'));
        assert(!await communication.has('someOtherKey'));
    });

    it('should not have key from previous test', async () => {
        assert(!await communication.has('myKey'));
    });

});
