const communication = require('../src/communication');
// const {startSwarm, killSwarm} = require('../test-daemon/swarmSetup');
const {spawnSwarm, despawnSwarm} = require('../test-daemon/setup');
const resetInNode = () => {

    if (process.env.daemonIntegration) {
		// return startSwarm()
		return spawnSwarm()

    } else {

    	// We use eval is so that webpack doesn't bundle the emulator,
    	// if we are compiling tests for the browser.

    	try {

    		return eval("require('swarmemulator')").reset(communication.getUuid());

    	} catch(e) {

    		throw new Error("bluzelle-js swarmemulator not found as a package. You must install or link this package manually as it is not listed in this projects proper dependencies.");

    	}
    	
	}

};


const resetInBrowser = () => new Promise(resolve => {

	const ws = new WebSocket('ws://localhost:8101');
	ws.onopen = () => {

		ws.send('reset');

	};

	ws.onmessage = () => {

		ws.close();
		resolve();

	};

});


module.exports = () => {

	if(typeof window === 'undefined') {

		return resetInNode();

	}
	else {

		return resetInBrowser();

	}

};
