// This file includes all the tests and is used for browser testing.

// It is webpack'd into main.test.pack.js and included in mocha.html.

require('../src/swarmClient/ecdsa_secp256k1.test.js');
require('../src/test/main.test.js');