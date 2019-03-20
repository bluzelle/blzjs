const {bluzelle, version} = require('../main');
const assert = require('assert');
const {pub_from_priv} = require('../ecdsa_secp256k1');

it('version', () => {

    assert(typeof version === 'string');
    assert(version.length > 0);

});


const log = false;
const entry = 'ws://localhost:50000';
const p2p_latency_bound = 100;
const private_pem = 'MHQCAQEEIFH0TCvEu585ygDovjHE9SxW5KztFhbm4iCVOC67h0tEoAcGBSuBBAAKoUQDQgAE9Icrml+X41VC6HTX21HulbJo+pV1mtWn4+evJAi8ZeeLEJp4xg++JHoDm8rQbGWfVM84eqnb/RVuIXqoz6F9Bg==';


describe('integration', () => {

    let bz;

    beforeEach(() => {

        bz = bluzelle({
            entry, 
            private_pem, 
            uuid: Math.random().toString(),
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


    it('writers', async () => {

        const bz = bluzelle({
            entry, 
            private_pem, 
            uuid: Math.random().toString(),
            log,
            p2p_latency_bound,
        });


        await bz.createDB();

        assert.deepEqual(
            await bz.getWriters(), 
            {
                owner: bz.publicKey(),
                writers: []
            }
        );


        const writers = [
            'MFYwEAYHKoZIzj0CAQYFK4EEAAoDQgAEndHOcS6bE1P9xjS/U+SM2a1GbQpPuH9sWNWtNYxZr0JcF+sCS2zsD+xlCcbrRXDZtfeDmgD9tHdWhcZKIy8ejQ==',
            'MFYwEAYHKoZIzj0CAQYFK4EEAAoDQgAE2cEPEoomeszFPuHzo2q45mfFkipLSCqc+pMlHCsGnZ5rJ4Bo27SZncCmwoazcYjoV9DjJjqi+p7IfSPRZCygaQ=='
        ];

        await bz.addWriters(writers);

        const writers_output = (await bz.getWriters()).writers;

        assert(writers_output.length === 2);
        assert(writers_output.includes(writers[0]));
        assert(writers_output.includes(writers[1]));


        // No duplicates 

        await bz.addWriters(writers);

        assert((await bz.getWriters()).writers.length === 2);


        await bz.deleteWriters(writers[0]);

        assert.deepEqual(
            await bz.getWriters(),
            {
                owner: bz.publicKey(),
                writers: [writers[1]]
            }
        );

        bz.close();

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


    it('public key', () => {

        assert.equal(bz.publicKey(), "MFYwEAYHKoZIzj0CAQYFK4EEAAoDQgAEY6L6fb2Xd9KZi05LQlZ83+0pIrjOIFvy0azEA+cDf7L7hMgRXrXj5+u6ys3ZSp2Wj58hTXsiiEPrRMMO1pwjRg==");

    });

    it('type assertions', async () => {

        await bz.createDB();

        assert.throws(() => bz.create('hello', 3));
        assert.throws(() => bz.addWriters(3));
        assert.throws(() => bz.addWriters(['w1', 'w2', {}]));

    });

});