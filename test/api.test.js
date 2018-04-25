const reset = require('../utils/reset');
const api = require('../api');
const assert = require('assert');
const exec = require('child_process').exec;
const {logFileMoved, logFileExists, readFile} = require('../utils/daemonLogHandlers');
const waitUntil = require('async-wait-until');
const {includes} = require('lodash');
const fs = require('fs');

let logFileName;

before('swarm startup hook', async () => {
    exec('cd ./resources; ./run-daemon.sh bluzelle.json');

    exec('cd ./resources; ./run-daemon.sh bluzelle2.json');

    await waitUntil(() => logFileName = logFileExists());
    await waitUntil(() => {
        let contents = fs.readFileSync('../../daemon-build/output/' + logFileName, 'utf8');

        // raft.cpp:582 stdouts 'I AM LEADER'
        return includes(contents, 'raft.cpp:582');
    });
    await api.connect('ws://localhost:50000', '71e2cd35-b606-41e6-bb08-f20de30df76c');
});

after( async () => {
    api.disconnect();
    exec('pkill -2 swarm');
    await waitUntil( () => logFileMoved(logFileName));
});

describe.only('bluzelle api', () => {

    // beforeEach(reset);

    const isEqual = (a, b) =>
        a.length === b.length && !a.some((v, i) => b[i] !== v);

    it('should be able to connect many times', () => {

        api.connect('ws://localhost:50000', '71e2cd35-b606-41e6-bb08-f20de30df76c');
        api.connect('ws://localhost:50000', '71e2cd35-b606-41e6-bb08-f20de30df76c');
        api.connect('ws://localhost:50000', '71e2cd35-b606-41e6-bb08-f20de30df76c');

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
