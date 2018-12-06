const bluzelle = require('../main');
const assert = require('assert');


describe('integration', () => {

    it('doesn\'t have key', async () => {

        const bz = bluzelle({
            entry: 'ws://localhost:50000', 
            private_pem: 'MHQCAQEEIFH0TCvEu585ygDovjHE9SxW5KztFhbm4iCVOC67h0tEoAcGBSuBBAAKoUQDQgAE9Icrml+X41VC6HTX21HulbJo+pV1mtWn4+evJAi8ZeeLEJp4xg++JHoDm8rQbGWfVM84eqnb/RVuIXqoz6F9Bg==', 
            uuid: Math.random().toString()
        });

        await bz.createDB();

        assert(!await bz.has('hello'));

    });


    it('has key', async () => {

        const bz = bluzelle({
            entry: 'ws://localhost:50000', 
            private_pem: 'MHQCAQEEIFH0TCvEu585ygDovjHE9SxW5KztFhbm4iCVOC67h0tEoAcGBSuBBAAKoUQDQgAE9Icrml+X41VC6HTX21HulbJo+pV1mtWn4+evJAi8ZeeLEJp4xg++JHoDm8rQbGWfVM84eqnb/RVuIXqoz6F9Bg==', 
            uuid: Math.random().toString()
        });

        await bz.createDB();

        await bz.create('hello', 'world');

        assert(await bz.has('hello'));

    });

});