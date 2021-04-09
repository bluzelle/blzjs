"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.newBzClient = exports.serializeRequests = exports.waitForProxyUp = exports.createKeys = exports.getServerToUse = exports.getBluzelleClient = exports.defaultGasParams = exports.getClient = exports.sentryWithClient = exports.DEFAULT_TIMEOUT = void 0;
const bluzelle_node_1 = require("../../../src/bluzelle-node");
const bluzelle_js_1 = require("../../../src/bluzelle-js");
const lodash_1 = require("lodash");
const swarmHelpers_1 = require("testing/lib/helpers/swarmHelpers");
const browserProxy_1 = require("./browserProxy");
const pythonProxy_1 = require("./pythonProxy");
const rubyProxy_1 = require("./rubyProxy");
const goProxy_1 = require("./goProxy");
exports.DEFAULT_TIMEOUT = 800000;
const axios_1 = __importDefault(require("axios"));
const delay_1 = __importDefault(require("delay"));
const javaProxy_1 = require("./javaProxy");
const phpProxy_1 = require("./phpProxy");
const remoteProxy_1 = require("./remoteProxy");
const cSharpProxy_1 = require("./cSharpProxy");
const lodash_2 = require("lodash");
const monet_1 = require("monet");
// Allow self signed certificates
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
require('dotenv').config();
const useLocalClient = () => {
    if (process.env.MNEMONIC && process.env.ENDPOINT) {
        return bluzelle_node_1.bluzelle({
            mnemonic: process.env.MNEMONIC || '',
            endpoint: process.env.ENDPOINT || '',
            uuid: Date.now().toString()
        });
    }
};
const sentryWithClient = async (extra = {}) => {
    if (useLocalClient()) {
        return Promise.resolve(useLocalClient());
    }
    if (exports.getServerToUse() === 'testnet') {
        const config = {
            mnemonic: "auction resemble there doll room uncle since gloom unfold service ghost beach cargo loyal govern orient book shrug heavy kit coil truly describe narrow",
            endpoint: "http://client.sentry.testnet.public.bluzelle.com:1317",
            uuid: Date.now().toString()
        };
        return bluzelle_node_1.bluzelle(config);
    }
    if (exports.getBluzelleClient() === 'remote') {
        const config = {
            mnemonic: "auction resemble there doll room uncle since gloom unfold service ghost beach cargo loyal govern orient book shrug heavy kit coil truly describe narrow",
            endpoint: "http://client.sentry.testnet.public.bluzelle.com:1317",
            uuid: Date.now().toString()
        };
        return await remoteProxy_1.remoteProxy(bluzelle_node_1.bluzelle(config));
    }
    else {
        const swarm = await swarmHelpers_1.getSwarm([swarmHelpers_1.SINGLE_SENTRY_SWARM]);
        return lodash_2.extend(await exports.getClient(swarm.getSentries()[0], swarm.getValidators()[0], extra), { swarm: swarm });
    }
};
exports.sentryWithClient = sentryWithClient;
const getClient = async (sentry, validator, extra = {}) => {
    const auth = await validator.getAuth();
    const endpoint = ['ruby', 'python', 'go', 'java', 'php', 'c-sharp'].includes(exports.getBluzelleClient()) ? `http://${await sentry.getIPAddress()}:1317` : `https://localhost:${sentry.getAdhocPort()}`;
    const vuserBz = bluzelle_node_1.bluzelle({
        mnemonic: auth.mnemonic,
        endpoint: endpoint,
        uuid: 'uuid'
    });
    const bluzelleConfig = {
        mnemonic: vuserBz.generateBIP39Account(),
        endpoint: endpoint,
        uuid: 'uuid',
        ...extra
    };
    let bz = bluzelle_node_1.bluzelle({ ...bluzelleConfig, endpoint: `https://localhost:${sentry.getAdhocPort()}` });
    await vuserBz.transferTokensTo(bz.address, 1000000, exports.defaultGasParams());
    exports.getBluzelleClient() === 'c-sharp' && (bz = await cSharpProxy_1.cSharpProxy(bz, bluzelleConfig));
    exports.getBluzelleClient() === 'php' && (bz = await phpProxy_1.phpProxy(bz, bluzelleConfig));
    exports.getBluzelleClient() === 'java' && (bz = await javaProxy_1.javaProxy(bz, bluzelleConfig));
    exports.getBluzelleClient() === 'python' && (bz = await pythonProxy_1.pythonProxy(bz, bluzelleConfig));
    exports.getBluzelleClient() === 'ruby' && (bz = await rubyProxy_1.rubyProxy(bz, bluzelleConfig));
    exports.getBluzelleClient() === 'go' && (bz = await goProxy_1.goProxy(bz, bluzelleConfig));
    exports.getBluzelleClient() === 'browser' && (bz = await browserProxy_1.browserProxy(bz, bluzelleConfig));
    exports.getBluzelleClient() === 'js' && (bz = await bluzelle_js_1.bluzelle(bluzelleConfig));
    exports.getBluzelleClient() === 'node' && (bz = bz);
    return bz;
};
exports.getClient = getClient;
const defaultGasParams = (gasInfo = {}) => ({ gas_price: 0.004, max_gas: 100000000, ...gasInfo });
exports.defaultGasParams = defaultGasParams;
const getBluzelleClient = () => { var _a; return ((_a = process.argv.find(it => it.includes('--bluzelle-client='))) === null || _a === void 0 ? void 0 : _a.replace('--bluzelle-client=', '')) || 'node'; };
exports.getBluzelleClient = getBluzelleClient;
const getServerToUse = () => { var _a; return (_a = process.argv.find(it => it.includes('--server'))) === null || _a === void 0 ? void 0 : _a.replace('--server=', ''); };
exports.getServerToUse = getServerToUse;
const createKeys = async (bz, count) => {
    const keys = lodash_1.range(0, count).map(n => `key-${n}`);
    const values = lodash_1.range(0, count).map(n => `value-${n}`);
    await bz.withTransaction(() => keys.map((key, idx) => bz.create(key, values[idx], exports.defaultGasParams())));
    return { keys, values };
};
exports.createKeys = createKeys;
const waitForProxyUp = (port) => {
    return new Promise(resolve => {
        (async function loop() {
            axios_1.default.get(`https://localhost:${port}`)
                .then(() => {
                console.log('Proxy up');
                resolve();
            })
                .catch((e) => {
                if (e.code) {
                    console.log('Waiting for proxy up', port);
                    delay_1.default(500).then(loop);
                }
                else {
                    console.log('Proxy up');
                    resolve();
                }
            });
        }());
    });
};
exports.waitForProxyUp = waitForProxyUp;
exports.serializeRequests = (() => {
    let queue = Promise.resolve();
    return (fn) => {
        return new Promise((resolve, reject) => {
            queue = queue.then(() => fn().then(resolve).catch(reject));
        });
    };
})();
const newBzClient = (bz) => monet_1.Some(bz.generateBIP39Account())
    .map(mnemonic => bluzelle_node_1.bluzelle({
    mnemonic,
    endpoint: bz.url,
    uuid: bz.uuid
}))
    .map(async (newBz) => {
    await bz.transferTokensTo(newBz.address, 1000, exports.defaultGasParams());
    return newBz;
})
    .join();
exports.newBzClient = newBzClient;
//# sourceMappingURL=client-helpers.js.map