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

        assert.deepEqual(await bz.size(), {
            bytes: 0,
            keys: 0,
            remainingBytes: 0
        });

        await bz.create('this', 'that');

        const sz = await bz.size();
        assert(sz.bytes > 0);
        assert(sz.keys === 1);
        assert(sz.remainingBytes === 0);

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


    it('ttl with create', async () => {

        await bz.createDB();

        await bz.create('1', '2', 1);
        assert.equal(await bz.read('1'),'2');

        assert(await bz.ttl('1') > 0);

        await new Promise(resolve => setTimeout(resolve, 1000));

        await assert.rejects(bz.read('1'));

    });

    it('ttl with expire', async () => {

        await bz.createDB();

        await bz.create('3', '4');
        await bz.expire('3', 1); // never resolves

        assert(await bz.ttl('3') > 0);

        await new Promise(resolve => setTimeout(resolve, 1000));

        await assert.rejects(bz.read('3'));

    });

    it('persist 1', async () => {

        await bz.createDB();

        await bz.create('5', '6', 1);
        await bz.persist('5');

        assert.equal(await bz.read('5'), '6');


        await new Promise(resolve => setTimeout(resolve, 1000));

        assert.equal(await bz.read('5'), '6');

    });


    it('persist 2', async () => {

        await bz.createDB();

        await bz.create('5', '6');
        await bz.persist('5');

        assert.equal(await bz.read('5'), '6');

        assert.equal(await bz.ttl('5'), 0);


        await new Promise(resolve => setTimeout(resolve, 1000));

        assert.equal(await bz.read('5'), '6');

    });

    it('persist 3', async () => {

        await bz.createDB();

        await bz.create('5', '6');
        await bz.ttl('5');

        assert.equal(await bz.read('5'), '6');

        assert.equal(await bz.ttl('5'), 0);


        await new Promise(resolve => setTimeout(resolve, 1000));

        assert.equal(await bz.read('5'), '6');

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


    it('writers', async () => {

        await bz.createDB();

        assert.deepEqual(
            await bz._getWriters(), 
            {
                owner: bz.publicKey(),
                writers: []
            }
        );


        const writers = [
            'MFYwEAYHKoZIzj0CAQYFK4EEAAoDQgAEndHOcS6bE1P9xjS/U+SM2a1GbQpPuH9sWNWtNYxZr0JcF+sCS2zsD+xlCcbrRXDZtfeDmgD9tHdWhcZKIy8ejQ==',
            'MFYwEAYHKoZIzj0CAQYFK4EEAAoDQgAE2cEPEoomeszFPuHzo2q45mfFkipLSCqc+pMlHCsGnZ5rJ4Bo27SZncCmwoazcYjoV9DjJjqi+p7IfSPRZCygaQ=='
        ];

        await bz._addWriters(writers);

        const writers_output = (await bz._getWriters()).writers;

        assert(writers_output.length === 2);
        assert(writers_output.includes(writers[0]));
        assert(writers_output.includes(writers[1]));


        // No duplicates 

        await bz._addWriters(writers);

        assert((await bz._getWriters()).writers.length === 2);


        await bz._deleteWriters(writers[0]);

        assert.deepEqual(
            await bz._getWriters(),
            {
                owner: bz.publicKey(),
                writers: [writers[1]]
            }
        );

        bz.close();

    });

});