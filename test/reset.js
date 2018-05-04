const communication = require('../communication');
const {startSwarm, killSwarm} = require('../test-daemon/swarmSetup');

const resetInNode = () => {

    if (process.env.daemonIntegration) {
		return startSwarm()

    } else {
		// This eval is so that webpack doesn't bundle the emulator,
    	// if we are compiling tests for the browser.
    	return eval("require('../test-emulator/emulator/Emulator')").reset(communication.getUuid());
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
