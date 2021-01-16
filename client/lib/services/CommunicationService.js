"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCosmos = exports.sendMessage = exports.withTransaction = exports.newCommunicationService = void 0;
const monet_1 = require("monet");
const lodash_1 = require("lodash");
const promise_passthrough_1 = require("promise-passthrough");
const delay_1 = __importDefault(require("delay"));
const cosmosjs = require('@cosmostation/cosmosjs');
const TOKEN_NAME = 'ubnt';
const dummyMessageResponse = {
    height: 0,
    txhash: '',
    gas_used: '',
    gas_wanted: '',
    data: []
};
exports.newCommunicationService = (api) => ({
    api,
    seq: '',
    account: ''
});
exports.withTransaction = (service, fn) => {
    if (service.transactionMessageQueue) {
        throw new Error('withTransaction() can not be nested');
    }
    service.transactionMessageQueue = [];
    fn();
    const result = sendMessages(service, service.transactionMessageQueue);
    service.transactionMessageQueue = undefined;
    return result;
};
exports.sendMessage = (ctx, message, gasInfo) => {
    var _a;
    return ctx.transactionMessageQueue ? Promise.resolve((_a = ctx.transactionMessageQueue) === null || _a === void 0 ? void 0 : _a.push({
        message, gasInfo
    }))
        .then(() => (dummyMessageResponse))
        : sendMessages(ctx, [{
                message,
                gasInfo
            }]);
};
const sendMessages = (service, messages) => {
    return new Promise((resolve, reject) => {
        msgChain = msgChain
            .then(() => {
            transmitTransaction(service, messages)
                .then(resolve)
                .catch(reject);
        })
            // hacky way to make sure that connections arrive at server in order
            .then(() => delay_1.default(200));
    });
};
const transmitTransaction = (service, messages) => {
    let cosmos;
    return exports.getCosmos(service.api)
        .then(c => cosmos = c)
        .then(() => getSequence(service, cosmos, service.api.address))
        .then((data) => monet_1.Some({
        msgs: messages.map(m => m.message),
        chain_id: cosmos.chainId,
        fee: getFeeInfo(combineGas(messages)),
        memo: 'no memo',
        account_number: data.account,
        sequence: data.seq
    })
        .map(cosmos.newStdMsg.bind(cosmos))
        .map((stdSignMsg) => cosmos.sign(stdSignMsg, cosmos.getECPairPriv(service.api.mnemonic), 'block'))
        .map(cosmos.broadcast.bind(cosmos))
        .map((p) => p
        .then(convertDataFromHexToString)
        .then(convertDataToObject)
        .then(checkErrors)
        .then((x) => ({ ...x, height: parseInt(x.height) })))
        .join());
};
let msgChain = Promise.resolve();
const getSequence = (() => {
    return (service, cosmos, address) => (service.accountRequested ? (service.accountRequested = service.accountRequested
        .then(() => service.seq = (parseInt(service.seq) + 1).toString())) : (service.accountRequested = cosmos.getAccounts(address)
        .then((data) => {
        service.seq = data.result.value.sequence,
            service.account = data.result.value.account_number;
    })))
        .then(() => ({
        seq: service.seq,
        account: service.account
    }));
})();
const convertDataFromHexToString = (res) => ({
    ...res,
    data: res.data ? Buffer.from(res.data, 'hex').toString() : undefined
});
const eitherJsonParse = (json) => {
    try {
        return monet_1.Right(JSON.parse(json));
    }
    catch (e) {
        return monet_1.Left(e);
    }
};
const convertDataToObject = (res) => monet_1.Right(res)
    .flatMap(res => res.data === undefined ? monet_1.Left(res) : monet_1.Right(res))
    .map(res => `[${res.data.split('}{').join('},{')}]`)
    .flatMap(eitherJsonParse)
    .map(data => ({ ...res, data }))
    .catchMap(x => monet_1.Right(res))
    .join();
const checkErrors = (res) => {
    if (res.error) {
        throw {
            txhash: res.txhash,
            height: res.height,
            error: res.error
        };
    }
    if (/signature verification failed/.test(res.raw_log)) {
        throw {
            txhash: res.txhash,
            height: res.height,
            error: 'signature verification failed'
        };
    }
    if (/insufficient fee/.test(res.raw_log)) {
        let [x, error] = res.raw_log.split(/[:;]/);
        throw {
            txhash: res.txhash,
            height: res.height,
            error: error.trim()
        };
    }
    if (/failed to execute message/.test(res.raw_log)) {
        const error = res.raw_log.split(';')[0];
        throw {
            txhash: res.txhash,
            height: res.height,
            error: error.trim()
        };
    }
    if (/^\[.*\]$/.test(res.raw_log) === false) {
        throw {
            txhash: res.txhash,
            height: res.height,
            failedMsg: undefined,
            failedMsgIdx: undefined,
            error: res.raw_log
        };
    }
    return res;
};
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
exports.getCosmos = lodash_1.memoize((api) => fetch(`${api.url}/node_info`)
    .then(x => x.json())
    .then(x => x.node_info.network)
    .then(chainId => cosmosjs.network(api.url, chainId))
    .then(promise_passthrough_1.passThrough(cosmos => cosmos.setPath("m/44\'/118\'/0\'/0/0")))
    .then(promise_passthrough_1.passThrough(cosmos => cosmos.bech32MainPrefix = 'bluzelle')));
//# sourceMappingURL=CommunicationService.js.map