const exec = require('child_process').exec;
const {logFileMoved, logFileExists} = require('../utils/daemonLogHandlers');
const waitUntil = require('async-wait-until');
const {includes} = require('lodash');
const fs = require('fs');

let logFileName;

module.exports = {
    startSwarm: async function () {
        this.timeout(3000);

        exec('cd ./daemon-resources/scripts; ./run-daemon.sh bluzelle.json');

        // Waiting briefly before starting second Daemon ensures the first starts as leader
        setTimeout(() => {
            exec('cd ./daemon-resources/scripts; ./run-daemon.sh bluzelle2.json')
        }, 1000);


        await
            waitUntil(() => logFileName = logFileExists());

        process.env.emulatorQuiet ||
        console.log(`******** logFileName: ${logFileName} *******`);

        await
            waitUntil(() => {
                let contents = fs.readFileSync('../../daemon-build/output/' + logFileName, 'utf8');

                // raft.cpp:582 stdouts 'I AM LEADER'
                return includes(contents, 'raft.cpp:582');
            });
    },
    killSwarm: async () => {
        exec('pkill -2 swarm');
        await waitUntil(() => logFileMoved(logFileName));
    }
};
