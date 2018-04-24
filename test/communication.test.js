const reset = require('./reset');
const communication = require('../communication');
const assert = require('assert');


describe('bluzelle connection', () => {

    // beforeEach(reset);

    beforeEach( () => {
        communication.connect('ws://localhost:8100', '71e2cd35-b606-41e6-bb08-f20de30df76c');
    });


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

    it('should be able to read and update base64 strings', async () => {

        await communication.create('mykey', 'abcdef');

        await communication.update('mykey', 'newval')

        assert(await communication.read('mykey') === 'newval')

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
