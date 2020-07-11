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
var _api, _messageQueue, _maxMessagesPerTransaction, _checkTransmitQueueTail, _currentTransactionId;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommunicationService = void 0;
const monet_1 = require("monet");
const lodash_1 = require("lodash");
const TOKEN_NAME = 'ubnt';
const counter = (() => {
    let start = 1;
    return () => start++;
})();
class CommunicationService {
    constructor(api) {
        _api.set(this, void 0);
        _messageQueue.set(this, []);
        _maxMessagesPerTransaction.set(this, 1);
        _checkTransmitQueueTail.set(this, Promise.resolve());
        _currentTransactionId.set(this, 0);
        __classPrivateFieldSet(this, _api, api);
    }
    static create(api) {
        return new CommunicationService(api);
    }
    sendMessage(message, gasInfo) {
        const p = new Promise((resolve, reject) => {
            __classPrivateFieldGet(this, _messageQueue).push({
                message: message,
                gasInfo: gasInfo,
                resolve: resolve,
                reject: reject,
                transactionId: __classPrivateFieldGet(this, _currentTransactionId)
            });
        });
        __classPrivateFieldGet(this, _messageQueue).length === 1 && (__classPrivateFieldSet(this, _checkTransmitQueueTail, __classPrivateFieldGet(this, _checkTransmitQueueTail).then(this.transmitQueueNeedsTransmit.bind(this))));
        return p;
    }
    transmitQueueNeedsTransmit() {
        monet_1.Some(__classPrivateFieldGet(this, _messageQueue))
            .flatMap(queue => queue.length ? monet_1.Some(__classPrivateFieldGet(this, _messageQueue)) : monet_1.None())
            .map(queue => [queue[0].transactionId, queue])
            .map(([transactionId, queue]) => [
            lodash_1.takeWhile(queue, (it) => it.transactionId === transactionId),
            queue
        ])
            .map(([messages, queue]) => {
            __classPrivateFieldSet(this, _messageQueue, lodash_1.without(queue, messages));
            return messages;
        })
            .map(this.transmitQueue.bind(this));
    }
    transmitQueue(messages) {
        return __classPrivateFieldGet(this, _api).cosmos.getAccounts(__classPrivateFieldGet(this, _api).address).then((data) => monet_1.Some({
            msgs: messages.map(m => m.message),
            chain_id: __classPrivateFieldGet(this, _api).chainId,
            fee: getFeeInfo(combineGas(messages)),
            memo: 'group',
            account_number: String(data.result.value.account_number),
            sequence: String(data.result.value.sequence)
        })
            .map(__classPrivateFieldGet(this, _api).cosmos.newStdMsg.bind(__classPrivateFieldGet(this, _api).cosmos))
            .map((stdSignMsg) => __classPrivateFieldGet(this, _api).cosmos.sign(stdSignMsg, __classPrivateFieldGet(this, _api).ecPairPriv, 'block'))
            .map(__classPrivateFieldGet(this, _api).cosmos.broadcast.bind(__classPrivateFieldGet(this, _api).cosmos))
            .map((p) => p
            .then(convertDataFromHexToString)
            .then(convertDataToObject)
            .then((x) => ({ ...x, height: parseInt(x.height) })))
            .map((p) => p
            .then(callRequestorsWithData(messages)))
            .join());
    }
}
exports.CommunicationService = CommunicationService;
_api = new WeakMap(), _messageQueue = new WeakMap(), _maxMessagesPerTransaction = new WeakMap(), _checkTransmitQueueTail = new WeakMap(), _currentTransactionId = new WeakMap();
const convertDataFromHexToString = (res) => ({ ...res, data: res.data ? Buffer.from(res.data, 'hex').toString() : undefined });
const convertDataToObject = (res) => ({ ...res, data: res.data !== undefined ? JSON.parse(`[${res.data.split('}{').join('},{')}]`) : undefined });
const callRequestorsWithData = (msgs) => (res) => msgs.reduce((memo, msg) => {
    return msg.resolve ? msg.resolve(memo) || memo : memo;
}, res);
const getFeeInfo = ({ max_fee, gas_price = 10, max_gas = 200000 }) => ({
    amount: [{
            denom: TOKEN_NAME,
            amount: (max_fee ? max_fee : max_gas * gas_price).toString()
        }],
    gas: max_gas.toString()
});
const combineGas = (transactions) => transactions.reduce((gasInfo, transaction) => {
    return {
        max_gas: (gasInfo.max_gas || 0) + (transaction.gasInfo.max_gas || 200000),
        max_fee: (gasInfo.max_fee || 0) + (transaction.gasInfo.max_fee || 0),
        gas_price: Math.max(gasInfo.gas_price || 0, transaction.gasInfo.gas_price || 0)
    };
}, {});
//# sourceMappingURL=CommunicationService.js.map