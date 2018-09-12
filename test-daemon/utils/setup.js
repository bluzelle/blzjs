const {spawn, exec} = require('child_process');
const waitUntil = require('async-wait-until');

const setupUtils = {
    swarm: {list: {'daemon0': 50000, 'daemon1': 50001, 'daemon2': 50002}},
    spawnSwarm: async () => {

        exec('cd ./test-daemon/daemon-build/output/; rm -rf .state');

        Object.keys(setupUtils.swarm.list).forEach((daemon, i) => {

            setupUtils.swarm[daemon] = spawn('./run-daemon.sh', [`bluzelle${i}.json`], {cwd: './test-daemon/scripts'});

            setupUtils.swarm[daemon].stdout.on('data', data => {
                if (data.toString().includes('RAFT State: Leader')) {
                    setupUtils.swarm.leader = daemon;
                }
            });
        });

        try {
            await waitUntil(() => setupUtils.swarm.leader, 7000);
        } catch (err) {
            console.log(`Failed to declare leader`)
        }
    },
    despawnSwarm: () => {

        exec('pkill -2 swarm');

        setupUtils.swarm.daemon0, setupUtils.swarm.daemon1, setupUtils.swarm.daemon2, setupUtils.swarm.leader = undefined;
    }
};

module.exports = setupUtils;
