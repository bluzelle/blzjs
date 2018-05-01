const communication = require('../communication');
const assert = require('assert');
const {startSwarm, killSwarm} = require('../utils/swarmSetup');

describe('load testing', () => {

    before(startSwarm);
    after(killSwarm);

    let arr = [...Array(12).keys()];

    beforeEach(async () => {
        await communication.connect(`ws://localhost:${process.env.port}`, '71e2cd35-b606-41e6-bb08-f20de30df76c');
    });

    it('should be able to get keys list', async () => {
        await communication.create('firstKey', 123);
        await communication.create('secondKey', 123);
        assert(await communication.keys) === ['firstKey', 'secondKey'];

    });


    arr.forEach(k => it('should be able to create and read', async () => {

        await communication.create('key' + k, 'abcdef' + k);

        assert(await communication.read('key' + k) === 'abcdef' + k)

    }));

    arr.forEach(k => it('should be able to update and read', async () => {

        await communication.update('key' + k, 'abcdef' + k + 'updated');

        assert(await communication.read('key' + k) === 'abcdef' + k + 'updated')

    }));

    arr.forEach(k => it('should be able to has', async () => {

        assert(await communication.has('key' + k, 'abcdef' + k + 'updated') === true );

    }));

    arr.forEach(k => it('should be able to delete', async () => {

        await communication.remove('key' + k, 'abcdef' + k + 'updated');

    }));


    it('should be able to get size', async () => {

        assert(await communication.size() >= 0);

    });

});
