"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, privateMap) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to get private field on non-instance");
    }
    return privateMap.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _messages;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Transaction = void 0;
const linked_list_1 = __importDefault(require("linked-list"));
class Transaction extends linked_list_1.default.Item {
    constructor() {
        super();
        _messages.set(this, []);
    }
    static create() { }
    addMessage(message) {
        __classPrivateFieldGet(this, _messages).push(message);
    }
    messageCount() {
        return __classPrivateFieldGet(this, _messages).length;
    }
    getMessages() {
        return __classPrivateFieldGet(this, _messages);
    }
}
exports.Transaction = Transaction;
_messages = new WeakMap();
//# sourceMappingURL=Transaction.js.map