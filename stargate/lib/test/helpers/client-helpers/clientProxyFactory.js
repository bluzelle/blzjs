"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clientProxyFactory = void 0;
const clientProxyFactory = (obj, execFn) => new Proxy(obj, {
    get: (obj, prop) => typeof obj[prop] === 'function' ? proxyFunction(prop, execFn) : obj[prop]
});
exports.clientProxyFactory = clientProxyFactory;
let insideTransactionMethods = undefined;
const proxyFunction = (prop, execFn) => (...args) => {
    if (prop === 'withTransaction') {
        console.log('proxy: transaction start');
        insideTransactionMethods = [];
        args[0]();
        const insideFunctions = insideTransactionMethods;
        insideTransactionMethods = undefined;
        console.log('proxy: transaction end');
        return execFn('withTransaction', [insideFunctions, args[1]]);
    }
    if (insideTransactionMethods) {
        console.log('proxy', prop, args);
        insideTransactionMethods.push({ method: prop, args });
        return;
    }
    return execFn(prop, args);
};
//# sourceMappingURL=clientProxyFactory.js.map