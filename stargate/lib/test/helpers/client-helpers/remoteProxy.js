"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.remoteProxy = void 0;
const clientProxyFactory_1 = require("./clientProxyFactory");
const axios_1 = __importDefault(require("axios"));
const client_helpers_1 = require("./client-helpers");
const PROXY_PORT = process.env.PROXY_PORT;
const PROXY_ADDRESS = process.env.PROXY_ADDRESS;
beforeEach(async function () {
    if (client_helpers_1.getBluzelleClient() === 'remote') {
        this.timeout(50000);
        console.log('--------------------------------------------');
        await axios_1.default.post(`http://${PROXY_ADDRESS}:${PROXY_PORT}`, { method: 'deleteAll', args: [client_helpers_1.defaultGasParams()] });
    }
});
const remoteProxy = async (bz) => {
    return clientProxyFactory_1.clientProxyFactory(bz, executeBluzelleMethod);
    function executeBluzelleMethod(method, args) {
        return client_helpers_1.serializeRequests(() => axios_1.default.post(`http://${PROXY_ADDRESS}:${PROXY_PORT}`, { method, args }))
            .then(res => res.data)
            .then((data) => data === null ? undefined : data)
            .catch((err) => {
            throw err.response.data;
        });
    }
};
exports.remoteProxy = remoteProxy;
//# sourceMappingURL=remoteProxy.js.map