const reset = require('../utils/reset');
const communication = require('../communication');
const assert = require('assert');
const {startSwarm, killSwarm} = require('../utils/swarmSetup');

describe('bluzelle connection', () => {

    if (process.env.daemonIntegration){
        beforeEach(startSwarm);
        afterEach(killSwarm)
    } else {
        beforeEach(reset);
    }

    beforeEach(() =>
        communication.connect(`ws://${process.env.address}:${process.env.port}`, '71e2cd35-b606-41e6-bb08-f20de30df76c'));


    it('should be able to connect', () => {});


    it('should reject bad connections', done => {

        communication.connect('fdsfdas', 'fdsafsd');
        communication.keys().catch(() => done());

    });

    it('should reject connection to a bad port', done => {

        communication.connect('ws://localhost:123', '71e2cd35-b606-41e6-bb08-f20de30df76c');
        communication.keys().catch(() => done());

    });

    // it('should be able to ping the connection', async () => {
    //     return communication.ping();

    // });

    it('should be able to create and read base64 strings', async () => {

        await communication.create('mykey', 'abcdef');

        await communication.update('mykey', 'newval');

        assert(await communication.read('mykey') === 'newval');

    });

    it('should be able to create and update base64 strings', async () => {

        await communication.create('mykey', 'abcdef');
        await communication.update('mykey', 'zxcv');

        assert(await communication.read('mykey') === 'zxcv');

    });

    it('should be able to query if the database has a key', async () => {

        await communication.create('myKey', 'abc');
        assert(await communication.has('myKey'));
        assert(!await communication.has('someOtherKey'));

    });

    it('should be able to remove a key', async () => {

        await communication.create('myKey', 'abc');
        await communication.remove('myKey');
        assert(!await communication.has('myKey'));

    });

    it('should be able to return size', async () => {
        assert(await communication.size() >= 0);
    });

    it('should throw an error when trying to read a non-existent key', done => {

        communication.read('abc123').catch(() => done());

    });

    it('should throw an error when trying to remove a non-existent key', done => {

        communication.remove('something').catch(() => done());

    });

    it('should throw an error when creating the same key twice', done => {

        communication.create('mykey', 123).then(() => {

            communication.create('mykey', 321).catch(() => done());

        });
    });

    it('should throw an error when trying to update a non-existent key', done => {

        communication.update('something', 123).catch(() => done());

    });

});
