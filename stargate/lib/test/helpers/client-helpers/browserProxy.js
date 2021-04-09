"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.browserProxy = void 0;
const puppeteer_1 = __importDefault(require("puppeteer"));
const fs_1 = __importDefault(require("fs"));
const path_1 = require("path");
const clientProxyFactory_1 = require("./clientProxyFactory");
let currentBrowser;
afterEach(() => currentBrowser === null || currentBrowser === void 0 ? void 0 : currentBrowser.close());
const isDebug = () => process.argv.includes('--debug');
const browserProxy = async (bz, bluzelleConfig) => {
    currentBrowser = await puppeteer_1.default.launch({ devtools: isDebug() });
    const page = await currentBrowser.newPage();
    await fs_1.default.promises.readFile(path_1.resolve(__dirname, '../../../node_modules/bluzelle/lib/bluzelle-js.js'))
        .then(buf => buf.toString())
        .then(content => page.addScriptTag({ content }));
    await instantiateBluzelleClientInBrowser(bluzelleConfig);
    return clientProxyFactory_1.clientProxyFactory(bz, executeBluzelleMethodInBrowser);
    function executeBluzelleMethodInBrowser(method, args) {
        return page.evaluate((method, args) => {
            if (method === 'withTransaction') {
                return window.bz.withTransaction(() => Promise.all(args[0].map(({ method, args }) => window.bz[method](...args))), args[1])
                    .then((result) => ({ result }))
                    .catch((error) => ({ error }));
            }
            else {
                const makeProxy = (x) => x instanceof Proxy ? x : Promise.resolve(x);
                return makeProxy(window.bz[method](...args))
                    .then((result) => ({ result }))
                    .catch((error) => {
                    if (error instanceof Error) {
                        throw error;
                    }
                    else {
                        return { error: error };
                    }
                });
            }
        }, method, args)
            .then((x) => {
            if (x.error) {
                throw x.error;
            }
            else {
                return x.result;
            }
        });
    }
    function instantiateBluzelleClientInBrowser(bluzelleConfig) {
        return page.evaluate((bluzelleConfig) => {
            window.bz = window.bluzelle(bluzelleConfig);
        }, bluzelleConfig);
    }
};
exports.browserProxy = browserProxy;
//# sourceMappingURL=browserProxy.js.map