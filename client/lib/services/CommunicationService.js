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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _api, _messageQueue, _maxMessagesPerTransaction, _checkTransmitQueueTail, _currentTransaction, _transactionInFlight;
Object.defineProperty(exports, "__esModule", { value: true });
exports.jsonRPC = exports.CommunicationService = void 0;
const monet_1 = require("monet");
const lodash_1 = require("lodash");
const promise_passthrough_1 = require("promise-passthrough");
const base_64_1 = __importDefault(require("base-64"));
const sort_json_1 = __importDefault(require("sort-json"));
const amino_js_1 = require("@tendermint/amino-js");
const TOKEN_NAME = 'ubnt';
class CommunicationService {
    constructor(api) {
        _api.set(this, void 0);
        _messageQueue.set(this, []);
        _maxMessagesPerTransaction.set(this, 1);
        _checkTransmitQueueTail.set(this, Promise.resolve());
        _currentTransaction.set(this, void 0);
        _transactionInFlight.set(this, false);
        __classPrivateFieldSet(this, _api, api);
    }
    static create(api) {
        return new CommunicationService(api);
    }
    setMaxMessagesPerTransaction(count) {
        __classPrivateFieldSet(this, _maxMessagesPerTransaction, count);
    }
    startTransaction(transaction) {
        __classPrivateFieldSet(this, _currentTransaction, transaction);
    }
    endTransaction() {
        __classPrivateFieldSet(this, _currentTransaction, undefined);
    }
    withTransaction(fn, transaction = { memo: '' }) {
        if (__classPrivateFieldGet(this, _currentTransaction)) {
            throw new Error('withTransaction() can not be nested');
        }
        this.startTransaction(transaction);
        const result = fn();
        this.endTransaction();
        return result;
    }
    sendMessage(message, gasInfo) {
        const p = new Promise((resolve, reject) => {
            __classPrivateFieldGet(this, _messageQueue).push({
                message,
                gasInfo,
                resolve,
                reject,
                transaction: __classPrivateFieldGet(this, _currentTransaction)
            });
        });
        __classPrivateFieldGet(this, _messageQueue).length === 1 && !__classPrivateFieldGet(this, _transactionInFlight) && (__classPrivateFieldSet(this, _checkTransmitQueueTail, __classPrivateFieldGet(this, _checkTransmitQueueTail).then(this.checkMessageQueueNeedsTransmit.bind(this))));
        return p;
    }
    checkMessageQueueNeedsTransmit() {
        monet_1.Some(__classPrivateFieldGet(this, _messageQueue))
            .flatMap(queue => queue.length ? monet_1.Some(__classPrivateFieldGet(this, _messageQueue)) : monet_1.None())
            .map(queue => [queue[0].transaction, queue])
            .map(([transaction, queue]) => [
            lodash_1.takeWhile(queue, (it, idx) => it.transaction === transaction
                && (it.transaction === undefined ? idx < __classPrivateFieldGet(this, _maxMessagesPerTransaction) : true)),
            queue
        ])
            .map(([messages, queue]) => {
            __classPrivateFieldSet(this, _messageQueue, lodash_1.without(queue, ...messages));
            return messages;
        })
            .map(messages => this.transmitTransaction(messages).then(this.checkMessageQueueNeedsTransmit.bind(this)));
    }
    transmitTransaction(messages) {
        __classPrivateFieldSet(this, _transactionInFlight, true);
        let cosmos;
        return __classPrivateFieldGet(this, _api).getCosmos()
            .then(c => cosmos = c)
            .then(() => ({ Address: __classPrivateFieldGet(this, _api).address }))
            .then((data) => __classPrivateFieldGet(this, _api).account(__classPrivateFieldGet(this, _api).address))
            .then((data) => {
            var _a;
            return monet_1.Some({
                msgs: messages.map(m => m.message),
                chain_id: cosmos.chainId,
                fee: getFeeInfo(combineGas(messages)),
                memo: ((_a = messages[0].transaction) === null || _a === void 0 ? void 0 : _a.memo) || 'no memo',
                account_number: data.account_number,
                sequence: data.sequence
            })
                .map(cosmos.newStdMsg.bind(cosmos))
                .map((stdSignMsg) => cosmos.sign(stdSignMsg, cosmos.getECPairPriv(__classPrivateFieldGet(this, _api).mnemonic), 'block'))
                .map(broadcastTx(__classPrivateFieldGet(this, _api).url))
                .map(promise_passthrough_1.passThrough(() => __classPrivateFieldSet(this, _transactionInFlight, false)))
                .map((p) => p
                .then(convertDataFromHexToString)
                .then(convertDataToObject)
                .then((x) => ({ ...x, height: parseInt(x.height) }))
                .then(callRequestorsWithData(messages))
                .catch((e) => callRequestorsWithData(messages)({ error: e })))
                .join();
        });
    }
}
exports.CommunicationService = CommunicationService;
_api = new WeakMap(), _messageQueue = new WeakMap(), _maxMessagesPerTransaction = new WeakMap(), _checkTransmitQueueTail = new WeakMap(), _currentTransaction = new WeakMap(), _transactionInFlight = new WeakMap();
const broadcastTx = (url) => (signedTx) => {
    return Promise.resolve(signedTx.tx)
        .then(tx => ({ 'type': 'auth/StdTx', value: tx }))
        .then(amino_js_1.marshalTx)
        .then(x => x)
        .then(Buffer.from)
        .then(hex => hex.toString('base64'))
        .then(x => x)
        .then(tx => ({ tx }))
        .then(params => exports.jsonRPC(url, 'broadcast_tx_commit', params))
        .then(x => x);
};
const convertDataFromHexToString = (res) => ({
    ...res,
    data: res.data ? Buffer.from(res.data, 'hex').toString() : undefined
});
const convertDataToObject = (res) => ({
    ...res,
    data: res.data !== undefined ? JSON.parse(`[${res.data.split('}{').join('},{')}]`) : undefined
});
const callRequestorsWithData = (msgs) => (res) => msgs.reduce((memo, msg) => {
    if (res.error) {
        return msg.reject({
            txhash: res.txhash,
            height: res.height,
            failedMsg: undefined,
            failedMsgIdx: undefined,
            error: res.error
        });
    }
    if (/signature verification failed/.test(res.raw_log)) {
        return msg.reject({
            txhash: res.txhash,
            height: res.height,
            failedMsg: undefined,
            failedMsgIdx: undefined,
            error: 'Unknown error'
        });
    }
    if (/insufficient fee/.test(res.raw_log)) {
        let [x, error] = res.raw_log.split(/[:;]/);
        return msg.reject({
            txhash: res.txhash,
            height: res.height,
            failedMsg: undefined,
            failedMsgIdx: undefined,
            error: error.trim()
        });
    }
    if (/failed to execute message/.test(res.raw_log)) {
        let [x, error, y, failedMsgIdx] = res.raw_log.split(':');
        failedMsgIdx = parseInt(failedMsgIdx);
        return msg.reject({
            txhash: res.txhash,
            height: res.height,
            failedMsg: msgs[failedMsgIdx].message,
            failedMsgIdx: parseInt(failedMsgIdx),
            error: error.trim()
        });
    }
    if (/^\[.*\]$/.test(res.raw_log) === false) {
        return msg.reject({
            txhash: res.txhash,
            height: res.height,
            failedMsg: undefined,
            failedMsgIdx: undefined,
            error: res.raw_log
        });
    }
    return msg.resolve ? msg.resolve(memo) || memo : memo;
}, res);
const getFeeInfo = ({ max_fee, gas_price = 0.002, max_gas = 10000000 }) => ({
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
exports.jsonRPC = (url, method, params) => {
    return fetch(url, {
        method: 'POST',
        mode: 'cors',
        cache: 'no-cache',
        credentials: 'same-origin',
        headers: {
            'Content-Type': 'text/json'
        },
        redirect: 'follow',
        referrerPolicy: 'no-referrer',
        body: sort_json_1.default(JSON.stringify({
            jsonrpc: "2.0",
            id: 0,
            method: method,
            params
        }))
    })
        .then(x => x.json())
        .then(promise_passthrough_1.passThrough(x => {
        if (x.error || !x.result) {
            throw x.error;
        }
    }))
        .then(x => JSON.parse(base_64_1.default.decode(x.result.response.value)));
};
//# sourceMappingURL=CommunicationService.js.map