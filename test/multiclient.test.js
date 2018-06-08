const reset = require('./reset');
const assert = require('assert');
const path = require('path');
const {killSwarm} = require('../test-daemon/swarmSetup');

const api1 = require('../api');

// This enables us to have two copies of the library with separate state
delete require.cache[path.resolve(__dirname + '/../communication.js')];
delete require.cache[path.resolve(__dirname + '/../api.js')];

const api2 = require('../api');


// Run if not testing in browser
(typeof window === 'undefined' ? describe : describe.skip)('multi-client bluzelle api', () => {

    beforeEach(reset);

    process.env.daemonIntegration && afterEach(killSwarm);

    describe('two clients with different UUID\'s', () => {

        context('interacting with the same key', () => {

            beforeEach(() => {
                api1.connect(`ws://${process.env.address}:${process.env.port}`, '4982e0b0-0b2f-4c3a-b39f-26878e2ac814');

                api2.connect(`ws://${process.env.address}:${process.env.port}`, '71e2cd35-b606-41e6-bb08-f20de30df76c');
            });

            // it('api1 should be able to ping the connection', () =>
            //     api1.ping());

            // it('api2 should be able to ping the connection', () =>
            //     api2.ping());

            it('client1 should be able to write to database', async () => {
                await api1.create('myKey', 123);
                assert(await api1.read('myKey') === 123);
            });

            it('client2 should be able to write to database', async () => {
                await api2.create('myKey', 345);
                assert(await api2.read('myKey') === 345);
            });

            context('number fields', async () => {

                beforeEach(async () => {
                    await api1.create('myKey', 123);
                    await api2.create('myKey', 345);
                });

                it('should be able to read with no cross talk', async () => {
                    assert(await api1.read('myKey') === 123);
                    assert(await api2.read('myKey') === 345);
                });

                it('should be able to update with no cross talk', async () => {
                    await api1.update('myKey', 999);

                    assert(await api2.read('myKey') === 345);
                });

                it('should be able to delete with no cross talk', async () => {
                    await api1.remove('myKey');

                    assert(await api2.read('myKey') === 345);
                });

            });

            context('text fields', async () => {

                beforeEach(async () => {
                    await api1.create('myKey', 'hello world');
                    await api2.create('myKey', 'good morning');
                });

                it('should be able to read with no cross talk', async () => {
                    assert(await api1.read('myKey') === 'hello world');
                    assert(await api2.read('myKey') === 'good morning');

                });

                it('should be able to update with no cross talk', async () => {
                    await api1.update('myKey', 'changed value');

                    assert(await api2.read('myKey') === 'good morning');
                });

                it('should be able to delete with no cross talk', async () => {
                    await api1.remove('myKey');

                    assert(await api2.read('myKey') === 'good morning');
                });

            });

            context('object fields', async () => {

                beforeEach(async () => {
                    await api1.create('myKey', {a: 5});
                    await api2.create('myKey', {b: 9});
                });

                it('should be able to read with no cross talk', async () => {
                    assert((await api1.read('myKey')).a === 5);
                    assert((await api2.read('myKey')).b === 9);

                });

                it('should be able to update with no cross talk', async () => {
                    await api1.update('myKey', {a: 500});

                    assert((await api2.read('myKey')).b === 9);
                });

                it('should be able to delete with no cross talk', async () => {
                    await api1.remove('myKey');

                    assert((await api2.read('myKey')).b === 9);
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

                context('should throw an error', () => {

                    it('when trying to read a key not in its database', done => {
                        api2.read('onlyInOne').catch(() => done());
                    });

                    it('when trying to update a key not in its database', done => {
                        api2.update('onlyInOne', '123').catch(() => done());
                    });

                    it('when trying to delete a key not in its database', done => {
                        api2.remove('onlyInOne').catch(() => done());
                    });
                });
            });
        });
    });

    describe('two clients with the same UUID\'s', () => {

        context('interacting with the same key', () => {

            beforeEach(() => {
                api1.connect(`ws://${process.env.address}:${process.env.port}`, '4982e0b0-0b2f-4c3a-b39f-26878e2ac814');

                api2.connect(`ws://${process.env.address}:${process.env.port}`, '4982e0b0-0b2f-4c3a-b39f-26878e2ac814');
            });

            // it('api1 should be able to ping the connection', () =>
            //     api1.ping());

            // it('api2 should be able to ping the connection', () =>
            //     api2.ping());

            it('client1 should be able to write to database', async () => {
                await api1.create('myKey', 123);
                assert(await api1.read('myKey') === 123);
            });

            it('client2 should be able to write to database', async () => {
                await api2.create('myKey', 345);
                assert(await api2.read('myKey') === 345);
            });

            it('should throw an error when creating the same key twice', done => {

                api1.create('mykey', 123).then(() => {

                    api2.create('mykey', 321).catch(() => done());

                });

            });


            context('creating, updating, and then reading', () => {

                context('number fields', () => {

                    beforeEach(async () => {
                        await api1.create('myNumKey', 123);
                        await api2.update('myNumKey', 345);
                    });

                    it('value should be updated by last call', async () => {
                        assert(await api1.read('myNumKey') !== 123);
                        assert(await api1.read('myNumKey') === 345);
                    });
                });

                context('text fields', () => {

                    beforeEach(async () => {
                        await api1.create('myTextKey', 'hello world');
                        await api2.update('myTextKey', 'goodbye world');
                    });

                    it('value should be updated by last call', async () => {
                        assert(await api1.read('myTextKey') !== 'hello world');
                        assert(await api1.read('myTextKey') === 'goodbye world');
                    });
                });

                context('object fields', () => {

                    beforeEach(async () => {
                        await api1.create('myObjKey', {a: 5});
                        await api2.update('myObjKey', {a: 100});
                    });

                    it('value should be updated by last call', async () => {
                        assert((await api1.read('myObjKey')).a !== 5);
                        assert((await api1.read('myObjKey')).a === 100);
                    });
                });

            });

            context('creating, deleting, and then reading', () => {

                context('number field', () => {

                    beforeEach(async () => {
                        await api1.create('myNumKey', 123);
                        await api2.remove('myNumKey');
                    });

                    it('should throw error when attempting to read', done => {
                        api1.read('myNumKey').catch(() => done());
                    });

                });

                context('text field', () => {

                    beforeEach(async () => {
                        await api1.create('myTextKey', 'hello world');
                        await api2.remove('myTextKey');
                    });

                    it('should throw error when attempting to read', done => {
                        api1.read('myTextKey').catch(() => done());
                    });

                });

                context('object field', () => {

                    beforeEach(async () => {
                        await api1.create('myObjKey', {a: 5});
                        await api2.remove('myObjKey');
                    });

                    it('should throw error when attempting to read', done => {
                        api1.read('myObjKey').catch(() => done());
                    });

                });
            });
        });

    });

    describe('basic multi threading test', () => {

        delete require.cache[path.resolve(__dirname + '/../communication.js')];
        delete require.cache[path.resolve(__dirname + '/../api.js')];

        const api3 = require('../api');

        delete require.cache[path.resolve(__dirname + '/../communication.js')];
        delete require.cache[path.resolve(__dirname + '/../api.js')];

        const api4 = require('../api');

        context('four clients with unique UUID\'s', () => {
            let arr = [1, 2, 3, 4];

            beforeEach(() => {
                api1.connect(`ws://${process.env.address}:${process.env.port}`, '4982e0b0-0b2f-4c3a-b39f-26878e2ac814');
                api2.connect(`ws://${process.env.address}:${process.env.port}`, '71e2cd35-b606-41e6-bb08-f20de30df76c');
                api3.connect(`ws://${process.env.address}:${process.env.port}`, 'cffb4aaa-5c4f-41e0-b098-c899635701e7');
                api4.connect(`ws://${process.env.address}:${process.env.port}`, 'af56a449-ae8d-473d-aade-4fdf9dac5bfc');
            });


            it('clients should be able to write and read', async () => {

                await Promise.all(arr.map((v) => eval('api' + v).create('myKey', 123)));

                await Promise.all(arr.map((v) => eval('api' + v).read('myKey')))
                    .then(v => v.map((v) => assert(v === 123)));
            });

            it('clients should be able to write, update, and read', async () => {

                await Promise.all(arr.map((v) => eval('api' + v).create('myKey', 123)));

                await Promise.all(arr.map((v) => eval('api' + v).update('myKey', 1234)));

                await Promise.all(arr.map((v) => eval('api' + v).read('myKey')))
                    .then(v => v.map((v) => assert(v === 1234)));
            });


        });
    });

});
