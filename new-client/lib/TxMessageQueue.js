"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, privateMap) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to get private field on non-instance");
    }
    return privateMap.get(receiver);
};
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, privateMap, value) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to set private field on non-instance");
    }
    privateMap.set(receiver, value);
    return value;
};
var _queue;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TxMessageQueue = void 0;
class TxMessageQueue {
    constructor() {
        _queue.set(this, []);
    }
    size() {
        return __classPrivateFieldGet(this, _queue).length;
    }
    add(item) {
        __classPrivateFieldGet(this, _queue).push(item);
    }
    hasMessages() {
        return !!__classPrivateFieldGet(this, _queue).length;
    }
    fetch() {
        const temp = __classPrivateFieldGet(this, _queue);
        __classPrivateFieldSet(this, _queue, []);
        return temp;
    }
}
exports.TxMessageQueue = TxMessageQueue;
_queue = new WeakMap();
TxMessageQueue.create = () => {
    return new TxMessageQueue();
};
//# sourceMappingURL=TxMessageQueue.js.map