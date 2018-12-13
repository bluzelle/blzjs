const {bluzelle} = require('../main');
const assert = require('assert');


describe('integration', () => {

    it('create and read', async () => {

        const bz = bluzelle({
            entry: 'ws://localhost:50000', 
            private_pem: 'MHQCAQEEIFH0TCvEu585ygDovjHE9SxW5KztFhbm4iCVOC67h0tEoAcGBSuBBAAKoUQDQgAE9Icrml+X41VC6HTX21HulbJo+pV1mtWn4+evJAi8ZeeLEJp4xg++JHoDm8rQbGWfVM84eqnb/RVuIXqoz6F9Bg==', 
            uuid: Math.random().toString()
        });

        await bz.createDB();

        await bz.create('hello', 'world');

        assert.equal(await bz.read('hello'), 'world');

    });

    it('update', async () => {

        const bz = bluzelle({
            entry: 'ws://localhost:50000', 
            private_pem: 'MHQCAQEEIFH0TCvEu585ygDovjHE9SxW5KztFhbm4iCVOC67h0tEoAcGBSuBBAAKoUQDQgAE9Icrml+X41VC6HTX21HulbJo+pV1mtWn4+evJAi8ZeeLEJp4xg++JHoDm8rQbGWfVM84eqnb/RVuIXqoz6F9Bg==', 
            uuid: Math.random().toString()
        });

        await bz.createDB();

        await bz.create('hello', 'world');

        await bz.update('hello', 'earth');

        assert.equal(await bz.read('hello'), 'earth');


    });


    it('has', async () => {

        const bz = bluzelle({
            entry: 'ws://localhost:50000', 
            private_pem: 'MHQCAQEEIFH0TCvEu585ygDovjHE9SxW5KztFhbm4iCVOC67h0tEoAcGBSuBBAAKoUQDQgAE9Icrml+X41VC6HTX21HulbJo+pV1mtWn4+evJAi8ZeeLEJp4xg++JHoDm8rQbGWfVM84eqnb/RVuIXqoz6F9Bg==', 
            uuid: Math.random().toString()
        });

        await bz.createDB();

        assert(!await bz.has('hello'));

        await bz.create('hello', 'world');

        assert(await bz.has('hello'));

    });


    it('delete', async () => {

        const bz = bluzelle({
            entry: 'ws://localhost:50000', 
            private_pem: 'MHQCAQEEIFH0TCvEu585ygDovjHE9SxW5KztFhbm4iCVOC67h0tEoAcGBSuBBAAKoUQDQgAE9Icrml+X41VC6HTX21HulbJo+pV1mtWn4+evJAi8ZeeLEJp4xg++JHoDm8rQbGWfVM84eqnb/RVuIXqoz6F9Bg==', 
            uuid: Math.random().toString()
        });

        await bz.createDB();

        await bz.create('hello', 'world');

        await bz.delete('hello');

        assert(!await bz.has('hello'));

    });


    it('size', async () => {

        const bz = bluzelle({
            entry: 'ws://localhost:50000', 
            private_pem: 'MHQCAQEEIFH0TCvEu585ygDovjHE9SxW5KztFhbm4iCVOC67h0tEoAcGBSuBBAAKoUQDQgAE9Icrml+X41VC6HTX21HulbJo+pV1mtWn4+evJAi8ZeeLEJp4xg++JHoDm8rQbGWfVM84eqnb/RVuIXqoz6F9Bg==', 
            uuid: Math.random().toString()
        });

        await bz.createDB();

        assert.equal(await bz.size(), 0);

        await bz.create('this', 'that');

        assert(await bz.size() > 0);

    });


    it('keys', async () => {    

        const bz = bluzelle({
            entry: 'ws://localhost:50000', 
            private_pem: 'MHQCAQEEIFH0TCvEu585ygDovjHE9SxW5KztFhbm4iCVOC67h0tEoAcGBSuBBAAKoUQDQgAE9Icrml+X41VC6HTX21HulbJo+pV1mtWn4+evJAi8ZeeLEJp4xg++JHoDm8rQbGWfVM84eqnb/RVuIXqoz6F9Bg==', 
            uuid: Math.random().toString()
        });

        await bz.createDB();

        assert.deepEqual(await bz.keys(), []);

        await bz.create('a', 'b');

        assert.deepEqual(await bz.keys(), ['a']);

    });


    it('hasDB/createDB/deleteDB', async () => {    

        const bz = bluzelle({
            entry: 'ws://localhost:50000', 
            private_pem: 'MHQCAQEEIFH0TCvEu585ygDovjHE9SxW5KztFhbm4iCVOC67h0tEoAcGBSuBBAAKoUQDQgAE9Icrml+X41VC6HTX21HulbJo+pV1mtWn4+evJAi8ZeeLEJp4xg++JHoDm8rQbGWfVM84eqnb/RVuIXqoz6F9Bg==', 
            uuid: Math.random().toString(),
        });


        assert(!await bz.hasDB());

        await bz.createDB();

        assert(await bz.hasDB());

        await bz.deleteDB();

        assert(!await bz.hasDB());

    });

});