const reset = require('./reset');
const communication = require('../lib/bluzelle.node');
const assert = require('assert');

const {despawnSwarm, swarm} = require('../test-daemon/setup');

let NUM_OF_RECORDS = 5;

describe(`load testing with ${NUM_OF_RECORDS} records`, () => {

    let arr = [...Array(NUM_OF_RECORDS).keys()];

    before(reset);

    process.env.daemonIntegration && after(despawnSwarm);

    beforeEach(() =>
        communication.connect(`ws://${process.env.address}:${process.env.daemonIntegration ? swarm.list[swarm.leader] : 8100}`, '71e2cd35-b606-41e6-bb08-f20de30df76c'));


    it(`can create keys`, async () => {

        await Promise.all(arr.map((v, i) => communication.create('key' + i, 'abcdef' + i)));
    });


    it('should be able to update and read', async () => {

        await Promise.all(
            arr.map((v, i) => communication.update('key' + i, 'updated' + i)));

        await Promise.all(arr.map((v, i) => communication.read('key' + i)))
            .then(v =>
                v.map((v,i) => assert(v === 'updated' + i)))

    });

    it('should be able to has', async () => {

        await Promise.all(arr.map((v, i) => communication.has('key' + i)))
            .then(v =>
                v.map( v => assert(v === true)))
    });

    it('should be able to get keys list', async () => {

        assert.deepEqual((await communication.keys()).sort(), (arr.map((v,i) => 'key' + i).sort()));
    });



    it('should be able to delete', async () => {

        await Promise.all(arr.map((v,i) => communication.remove('key' + i)));
    });


    it('should be able to get size', async () => {

        assert(await communication.size() >= 0);
    });

});
