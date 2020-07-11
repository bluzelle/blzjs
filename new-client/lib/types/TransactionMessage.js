"use strict";
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, privateMap, value) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to set private field on non-instance");
    }
    privateMap.set(receiver, value);
    return value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, privateMap) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to get private field on non-instance");
    }
    return privateMap.get(receiver);
};
var _msg, _resolve, _reject;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionMessage = void 0;
class TransactionMessage {
    constructor(msg, gasInfo) {
        _msg.set(this, void 0);
        _resolve.set(this, void 0);
        _reject.set(this, void 0);
        __classPrivateFieldSet(this, _msg, msg);
        this.gasInfo = gasInfo;
        this.promise = new Promise((resolve, reject) => {
            __classPrivateFieldSet(this, _reject, reject);
            __classPrivateFieldSet(this, _resolve, resolve);
        });
    }
    static create(msg, gasInfo) {
        return new TransactionMessage(msg, gasInfo);
    }
    getMessage() {
        return __classPrivateFieldGet(this, _msg);
    }
}
exports.TransactionMessage = TransactionMessage;
_msg = new WeakMap(), _resolve = new WeakMap(), _reject = new WeakMap();
//# sourceMappingURL=TransactionMessage.js.map