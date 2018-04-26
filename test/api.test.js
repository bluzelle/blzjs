const reset = require('./reset');
const api = require('../api');
const assert = require('assert');


describe('bluzelle api', () => {

    beforeEach(reset);

    beforeEach( async () => {
        await api.connect('ws://localhost:8100', '71e2cd35-b606-41e6-bb08-f20de30df76c');
    });


    const isEqual = (a, b) =>
        a.length === b.length && !a.some((v, i) => b[i] !== v);

    it('should be able to connect many times', async () => {

        await api.connect('ws://localhost:8100', '71e2cd35-b606-41e6-bb08-f20de30df76c');
        await api.connect('ws://localhost:8100', '71e2cd35-b606-41e6-bb08-f20de30df76c');
        await api.connect('ws://localhost:8100', '71e2cd35-b606-41e6-bb08-f20de30df76c');

    });

    it('should be able to create and read number fields', async () => {
        await api.create('myKey', 123);
        assert(await api.read('myKey') === 123);

    });

    it('should be able to create and read text fields', async () => {

        await api.create('myOtherKey', "hello world");
        assert(await api.read('myOtherKey') === "hello world");


        await api.create('interestingString', "aGVsbG8gd29ybGQNCg==");
        assert(await api.read('interestingString') === "aGVsbG8gd29ybGQNCg==");

    });

    it('should be able to create and read object fields', async () => {

        await api.create('myObjKey', { a: 5 });
        assert((await api.read('myObjKey')).a === 5);

    });

    it('should be able to get a list of keys', async () => {

        await api.create('hello123', 10);
        await api.create('test', 11);

        assert(isEqual(await api.keys(), ['hello123', 'test']));
        assert(!isEqual(await api.keys(), ['blah', 'bli']));

    });

});
