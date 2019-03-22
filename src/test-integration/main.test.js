const {bluzelle, version} = require('../main');
const assert = require('assert');
const {pub_from_priv, random_key} = require('../ecdsa_secp256k1');
const elliptic = require('elliptic');


it('version', () => {

    assert(typeof version === 'string');
    assert(version.length > 0);

});


const log = false;
const entry = 'ws://localhost:50000';
const p2p_latency_bound = 100;


describe('integration', () => {

    let bz;

    beforeEach(() => {

        bz = bluzelle({
            entry, 
            private_pem: random_key(),
            log,
            p2p_latency_bound,
        });

    });

    afterEach(() => {
        bz.close();
    });


    it('create and read', async () => {

        await assert.rejects(bz.quickread('blah'));
        await assert.rejects(bz.read('blah'));

        await bz.createDB();

        await bz.create('hello', 'world');

        await assert.rejects(bz.create('hello', 'whence'));

        assert.equal(await bz.read('hello'), 'world');

        assert.equal(await bz.quickread('hello'), 'world');

    });



    it('update', async () => {

        await bz.createDB();

        await assert.rejects(bz.update('hello', 'whence'));

        await bz.create('hello', 'world');

        await bz.update('hello', 'earth');

        assert.equal(await bz.read('hello'), 'earth');

    });


    it('has', async () => {

        await bz.createDB();

        assert(!await bz.has('hello'));

        await bz.create('hello', 'world');

        assert(await bz.has('hello'));

    });



    it('delete', async () => {

        await bz.createDB();

        await assert.rejects(bz.delete('hello'));

        await bz.create('hello', 'world');

        await bz.delete('hello');

        assert(!await bz.has('hello'));

    });


    it('size', async () => {

        await bz.createDB();

        assert.equal(await bz.size(), 0);

        await bz.create('this', 'that');

        assert(await bz.size() > 0);

    });


    it('keys', async () => {    

        await assert.rejects(bz.keys());

        await bz.createDB();

        assert.deepEqual(await bz.keys(), []);

        await bz.create('a', 'b');

        assert.deepEqual(await bz.keys(), ['a']);
        
    });


    it('hasDB/createDB/deleteDB', async () => {    

        await assert.rejects(bz.deleteDB());

        assert(!await bz.hasDB());

        await bz.createDB();

        await assert.rejects(bz.createDB());

        assert(await bz.hasDB());

        await bz.deleteDB();

        assert(!await bz.hasDB());

    });


    it('ttl', async () => {

        await bz.createDB();

        await bz.create('1', '2', 1);
        // or await bz.expire('1', 1);

        await new Promise(resolve => setTimeout(resolve, 1000));

        await assert.rejects(bz.read('1'));

    });


    it('status', async () => {

        const status = await bz.status();

        assert(status.swarmGitCommit);
        assert(status.uptime);

    });


    it('type assertions', async () => {

        await bz.createDB();

        assert.throws(() => bz.create('hello', 3));
        assert.throws(() => bz.addWriters(3));
        assert.throws(() => bz.addWriters(['w1', 'w2', {}]));

    });

});