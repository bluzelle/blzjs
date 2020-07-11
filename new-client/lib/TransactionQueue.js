"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionQueue = void 0;
const linked_list_1 = __importDefault(require("linked-list"));
class TransactionQueue extends linked_list_1.default {
    static create() {
        return new TransactionQueue();
    }
}
exports.TransactionQueue = TransactionQueue;
//# sourceMappingURL=TransactionQueue.js.map