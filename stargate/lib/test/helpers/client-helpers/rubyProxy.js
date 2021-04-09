"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rubyProxy = void 0;
const clientProxyFactory_1 = require("./clientProxyFactory");
const axios_1 = __importDefault(require("axios"));
const lodash_1 = require("lodash");
const DockerManager_1 = require("./dockerfiles/DockerManager");
const client_helpers_1 = require("./client-helpers");
const rubyProxy = async (bz, bluzelleConfig) => {
    console.log(bluzelleConfig);
    const env = {
        MNEMONIC: bluzelleConfig.mnemonic,
        ENDPOINT: bluzelleConfig.endpoint,
        UUID: bluzelleConfig.uuid,
        DEBUG: '1',
        PORT: '5000'
    };
    await DockerManager_1.deleteProxyContainer('ruby');
    await DockerManager_1.startProxyContainer('ruby', env);
    await client_helpers_1.waitForProxyUp(5000);
    return clientProxyFactory_1.clientProxyFactory(bz, executeBluzelleMethod);
    function executeBluzelleMethod(method, args) {
        return client_helpers_1.serializeRequests(() => axios_1.default.post('http://localhost:5000', { method: lodash_1.snakeCase(method), args }))
            .then(res => res.data)
            .then((data) => data === null ? undefined : data)
            .catch((err) => {
            const msg = err.response.data.raw_log || err.response.data.error || err.response.data;
            console.log(msg);
            throw new Error(msg);
        });
    }
};
exports.rubyProxy = rubyProxy;
//# sourceMappingURL=rubyProxy.js.map