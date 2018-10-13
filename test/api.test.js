const reset = require('./reset');
const { BluzelleClient } = require('../lib/bluzelle-node');
const assert = require('assert');
const {isEqual} = require('lodash');
const waitUntil = require('async-wait-until');

const {despawnSwarm, swarm} = require('../test-daemon/utils/setup');


describe('bluzelle api', () => {

    beforeEach(reset);

    process.env.daemonIntegration && afterEach(despawnSwarm);


    let api;

    beforeEach(() => {

        api = new BluzelleClient(
            `ws://${process.env.address}:${process.env.daemonIntegration ? swarm.list[swarm.leader] : 8100}`, 
            '71e2cd35-b606-41e6-bb08-f20de30df76c', 
            false
            );

        return api.connect();
    
    });


    const isEqual = (a, b) =>
        a.length === b.length && !a.some((v, i) => b[i] !== v);


    it('should be able to connect', () => {});

    it('should not be able to connect many times', async () => {

        const url = `ws://${process.env.address}:${process.env.daemonIntegration ? swarm.list[swarm.leader] : 8100}`,
            uuid = '71e2cd35-b606-41e6-bb08-f20de30df76c';

        await assert.rejects(api.connect(url, uuid));
    
    });


    it('should be able to connect after a disconnect', async () => {

        api.disconnect();

        await api.connect(`ws://${process.env.address}:${process.env.daemonIntegration ? swarm.list[swarm.leader] : 8100}`, '71e2cd35-b606-41e6-bb08-f20de30df76c');

    });



    it('should get an empty list of keys', async () => {

        assert((await api.keys()).length === 0);

    });


    it('should be able to subscribe/unsubscribe to a key', async () => {

        const id = await api.subscribe('test key', v => {});

        assert(typeof id === 'number');

        await api.unsubscribe(id);

    });


    it('should throw an error when unsubscribing from a key where there is no subscription', done => {

        api.unsubscribe(0).catch(() => done());

    });


    it('should be able to use subscriptions', async () => {

        let value;

        const id = await api.subscribe('test key', v => { value = v; });

        await api.createAck('test key', 'sharona');

        await waitUntil(() => value === 'sharona');

        await api.updateAck('test key', 'tuna');

        await waitUntil(() => value === 'tuna');


        await api.unsubscribe(id);

        await api.updateAck('test key', 'thence');

        // Wait 300ms
        await new Promise(resolve => setTimeout(resolve, 300));

        assert(value === 'tuna');


        const id2 = await api.subscribe('test key', v => { value = v; });

        await api.removeAck('test key');

        await waitUntil(() => value === undefined);

    });


    it('should be able to have multiple subscriptions', async () => {

        let value1, value2;

        const id1 = await api.subscribe('whence', v => { value1 = v; });
        const id2 = await api.subscribe('whence', v => { value2 = v; });

        api.createAck('whence', 'thence');

        await waitUntil(() => 
            value1 === 'thence' && 
            value2 === 'thence');

        await api.unsubscribe(id1);

        api.updateAck('whence', 'my sharona');

        await waitUntil(() =>
            value1 === 'thence' && 
            value2 === 'my sharona');

    });

    it('should be able to create and read text fields', async () => {

        await api.create('myOtherKey', "hello world");
        assert(await api.read('myOtherKey') === "hello world");


        await api.create('interestingString', "aGVsbG8gd29ybGQNCg==");
        assert(await api.read('interestingString') === "aGVsbG8gd29ybGQNCg==");

    });


    it('should be able to get a list of keys', async () => {

        await api.create('hello123', '10');
        await api.create('test', '11');

        let sortedResult = (await api.keys()).sort();

        assert(isEqual(sortedResult, (['test', 'hello123']).sort()));
        assert(!isEqual(sortedResult, (['blah', 'bli']).sort()));

    });

    it('should reject connection to a bad port', done => {

        api.connect('ws://localhost:123', '71e2cd35-b606-41e6-bb08-f20de30df76c')
            .catch(() => done());

    });

    it('should be able to query if the database has a key', async () => {

        await api.create('myKey', 'abc');
        assert(await api.has('myKey'));
        assert(!await api.has('someOtherKey'));

    });

    it('should be able to remove a key', async () => {

        await api.create('myKey', 'abc');
        await api.remove('myKey');

        assert(!await api.has('myKey'));

    });

    it('should be able to return size', async () => {
        assert(await api.size() >= 0);
    });

    it('should throw an error when trying to read a non-existent key', done => {

        api.read('abc123').catch(() => done());

    });

    it('should throw an error when trying to remove a non-existent key', done => {

        api.remove('something').catch(() => done());

    });

    it('should throw an error when creating the same key twice', done => {

        api.create('mykey', '123').then(() => {

            api.create('mykey', '321').catch(() => done());

        });
    });

    it('should throw an error when trying to update a non-existent key', done => {

        api.update('something', '123').catch(() => done());

    });

    it('should return size > 0 when db is not empty', async () => {

        await api.create('myKey', '123');
        assert((await api.size()) > 0);

    });


    it('should return size 0 when db is empty', async () => {

        assert((await api.size()) === 0);

    });


});


it('should reject a command if there is no connection', async () => {

    const api = new BluzelleClient('', '');

    await assert.rejects(api.read('mykey'));

});
