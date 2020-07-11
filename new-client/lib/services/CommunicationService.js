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
var _api, _transactionQueue, _waiter, _maxMessagesPerTransaction;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommunicationService = void 0;
const monet_1 = require("monet");
const TransactionQueue_1 = require("../TransactionQueue");
const TransactionMessage_1 = require("../types/TransactionMessage");
const Transaction_1 = require("../Transaction");
const TOKEN_NAME = 'ubnt';
class CommunicationService {
    constructor(api) {
        _api.set(this, void 0);
        _transactionQueue.set(this, TransactionQueue_1.TransactionQueue.create());
        _waiter.set(this, void 0);
        _maxMessagesPerTransaction.set(this, 1);
        __classPrivateFieldSet(this, _api, api);
    }
    static create(api) {
        return new CommunicationService(api);
    }
    sendMessage(message, gasInfo) {
        var _a;
        const msg = TransactionMessage_1.TransactionMessage.create(message, gasInfo);
        __classPrivateFieldGet(this, _transactionQueue).tail || __classPrivateFieldGet(this, _transactionQueue).append(Transaction_1.Transaction.create());
        (_a = __classPrivateFieldGet(this, _transactionQueue).tail) === null || _a === void 0 ? void 0 : _a.addMessage(msg);
        this.checkTransmitQueueNeedsTransmit();
        return msg.promise;
    }
    checkTransmitQueueNeedsTransmit() {
        if (__classPrivateFieldGet(this, _transactionQueue).head && __classPrivateFieldGet(this, _transactionQueue).head.messageCount() >= __classPrivateFieldGet(this, _maxMessagesPerTransaction)) {
            __classPrivateFieldGet(this, _waiter) && clearTimeout(__classPrivateFieldGet(this, _waiter));
            __classPrivateFieldSet(this, _waiter, undefined);
            this.transmitQueue();
        }
        else {
            __classPrivateFieldGet(this, _waiter) || (__classPrivateFieldSet(this, _waiter, setTimeout(() => __classPrivateFieldGet(this, _transactionQueue).head && this.transmitQueue.bind(this), 100)));
        }
    }
    transmitQueue() {
        var _a;
        __classPrivateFieldSet(this, _waiter, undefined);
        const transaction = (_a = __classPrivateFieldGet(this, _transactionQueue).head) === null || _a === void 0 ? void 0 : _a.detach();
        return __classPrivateFieldGet(this, _api).cosmos.getAccounts(__classPrivateFieldGet(this, _api).address).then((data) => monet_1.Identity.of({
            msgs: transaction === null || transaction === void 0 ? void 0 : transaction.getMessages().map(x => x.getMessage()),
            chain_id: __classPrivateFieldGet(this, _api).chainId,
            fee: getFeeInfo(combineGas((transaction === null || transaction === void 0 ? void 0 : transaction.getMessages()) || [])),
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
        //                    .then(callRequestorsWithData(transaction)),
        )
            .join());
    }
}
exports.CommunicationService = CommunicationService;
_api = new WeakMap(), _transactionQueue = new WeakMap(), _waiter = new WeakMap(), _maxMessagesPerTransaction = new WeakMap();
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