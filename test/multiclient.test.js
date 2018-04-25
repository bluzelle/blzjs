const reset = require('../utils/reset');
const assert = require('assert');
const path = require('path');
const {beforeStartSwarm, afterKillSwarm} = require('../utils/swarmSetup');


const api1 = require('../api');

// This enables us to have two copies of the library with seperate state
delete require.cache[path.resolve(__dirname + '/../communication.js')];
delete require.cache[path.resolve(__dirname + '/../api.js')];

const api2 = require('../api');


// Run if testing in node, otherwise skip
(typeof window === 'undefined' ? describe : describe.skip)('multi-client bluzelle api', () => {

    beforeStartSwarm();
    afterKillSwarm();

    describe('two clients with different UUID\'s interacting with the same key', () => {


        beforeEach( () => {
            api1.connect(`ws://localhost:${process.env.port}`, '4982e0b0-0b2f-4c3a-b39f-26878e2ac814');

            api2.connect(`ws://localhost:${process.env.port}`, '71e2cd35-b606-41e6-bb08-f20de30df76c');
        });

        // it('api1 should be able to ping the connection', () =>
        //     api1.ping());

        // it('api2 should be able to ping the connection', () =>
        //     api2.ping());

        it('api1 should be able to write to database', async () => {
            await api1.create('myKey', 123);
            assert(await api1.read('myKey') === 123);
        });

        it('api2 should be able to write to database', async () => {
            await api2.create('myKey', 345);
            assert(await api2.read('myKey') === 345);
        });

        describe('number fields', async () => {

            beforeEach(async () => {
                await api1.create('myKey00001', 123);
                await api2.create('myKey00001', 345);
            });

            it('should be able to read with no collision', async () => {
                assert(await api1.read('myKey00001') === 123);
                assert(await api2.read('myKey00001') === 345);
            });

            it('should be able to update from one and not affect the other', async () => {
                await api1.update('myKey00001', 999);

                assert(await api2.read('myKey00001') === 345);
            });

            it('should be able to delete from one and not affect the other', async () => {
                await api1.remove('myKey00001');

                assert(await api2.read('myKey00001') === 345);
            });

        });

        describe('text fields', async () => {

            beforeEach(async () => {
                await api1.create('myKey00004', 'hello world');
                await api2.create('myKey00004', 'good morning');
            });

            it('should be able to read with no collision', async () => {
                assert(await api1.read('myKey00004') === 'hello world');
                assert(await api2.read('myKey00004') === 'good morning');

            });

            it('should be able to update from one and not affect the other', async () => {
                await api1.update('myKey00004', 'changed value');

                assert(await api2.read('myKey00004') === 'good morning');
            });

            it('should be able to delete from one and not affect the other', async () => {
                await api1.remove('myKey00004');

                assert(await api2.read('myKey00004') === 'good morning');
            });

        });

        describe('object fields', async () => {

            beforeEach(async () => {
                await api1.create('myKey00005', {a: 5});
                await api2.create('myKey00005', {b: 9});
            });

            it('should be able to read with no collision', async () => {
                assert((await api1.read('myKey00005')).a === 5);
                assert((await api2.read('myKey00005')).b === 9);

            });

            it('should be able to update from one and not affect the other', async () => {
                await api1.update('myKey00005', {a: 500});

                assert((await api2.read('myKey00005')).b === 9);
            });

            it('should be able to delete from one and not affect the other', async () => {
                await api1.remove('myKey00005');

                assert((await api2.read('myKey00005')).b === 9);
            });

        });

        describe('attempting to access keys of another client', () => {

            beforeEach(async () => {
                await api1.create('onlyInOne', 'something');
            });

            it('should only be able to access keys in its database', async () => {
                assert(await api1.has('onlyInOne'));
                assert(!await api2.has('onlyInOne'));
            });

            it('should throw an error when trying to read a key not in its database', done => {
                api2.read('onlyInOne').catch(() => done());
            });

            it('should throw an error when trying to update a key not in its database', done => {
                api2.remove('onlyInOne').catch(() => done());
            });

            it('should throw an error when trying to delete a key not in its database', done => {
                api2.remove('onlyInOne').catch(() => done());
            });

        });
    });

    describe('two clients with the same UUID\'s interacting with the same key', () => {

        // beforeEach(reset);

        beforeEach( () => {
            api1.connect(`ws://localhost:${process.env.port}`, '4982e0b0-0b2f-4c3a-b39f-26878e2ac814');

            api2.connect(`ws://localhost:${process.env.port}`, '4982e0b0-0b2f-4c3a-b39f-26878e2ac814');
        });


        // it('api1 should be able to ping the connection', () =>
        //     api1.ping());

        // it('api2 should be able to ping the connection', () =>
        //     api2.ping());

        it('api1 should be able to write to database', async () => {
            await api1.create('myKey', 123);
            assert(await api1.read('myKey') === 123);
        });

        it('api2 should be able to write to database', async () => {
            await api2.create('myKey', 345);
            assert(await api2.read('myKey') === 345);
        });

        describe('api1\'s key should be mutated by api2\'s call', async () => {

            describe('creating, updating, and then reading', () => {

                describe('number fields', () => {

                    beforeEach(async () => {
                        await api1.create('myNumKey', 123);
                        await api2.create('myNumKey', 345);
                    });

                    it('value should be equal to last call', async () => {
                        assert(await api1.read('myNumKey') !== 123);
                        assert(await api1.read('myNumKey') === 345);
                    });
                });

                describe('text fields', () => {

                    beforeEach(async () => {
                        await api1.create('myTextKey', 'hello world');
                        await api2.create('myTextKey', 'goodbye world');
                    });

                    it('value should be equal to last call', async () => {
                        assert(await api1.read('myTextKey') !== 'hello world');
                        assert(await api1.read('myTextKey') === 'goodbye world');
                    });
                });

                describe('object fields', () => {

                    beforeEach(async () => {
                        await api1.create('myObjKey', { a : 5 });
                        await api2.create('myObjKey', { a : 100});
                    });

                    it('value should be equal to last call', async () => {
                        assert((await api1.read('myObjKey')).a !== 5 );
                        assert((await api1.read('myObjKey')).a === 100);
                    });
                });

            });

            describe('creating, deleting, and then reading', () => {

                describe('number field', () => {

                    beforeEach(async () => {
                        await api1.create('myNumKey2', 123);
                        await api2.remove('myNumKey2');
                    });

                    it('throw error when attempting to read', done => {
                        api1.read('myNumKey2').catch(() => done());
                    });

                });

                describe('text field', () => {

                    beforeEach(async () => {
                        await api1.create('myTextKey2', 'hello world');
                        await api2.remove('myTextKey2');
                    });

                    it('throw error when attempting to read', done => {
                        api1.read('myTextKey2').catch(() => done());
                    });

                });

                describe('object field', () => {

                    beforeEach(async () => {
                        await api1.create('myObjKey3', { a : 5 });
                        await api2.remove('myObjKey3');
                    });

                    it('throw error when attempting to read', done => {
                        api1.read('myObjKey3').catch(() => done());
                    });

                });
            });
        });
    });
});
