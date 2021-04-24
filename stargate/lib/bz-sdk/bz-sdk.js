"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bluzelle = void 0;
const rpc_1 = require("../client-lib/rpc");
const query_1 = require("../codec/crud/query");
const tx_1 = require("../codec/crud/tx");
const query_2 = require("../codec/nft/query");
const tx_2 = require("../codec/nft/tx");
const CrudMsgTypes = __importStar(require("../codec/crud/tx"));
const NftMsgTypes = __importStar(require("../codec/nft/tx"));
const CommunicationService_1 = require("../client-lib/CommunicationService");
const bluzelle = (options) => Promise.resolve(CommunicationService_1.newCommunicationService(options.url, options.mnemonic || ''))
    .then(cs => Promise.all([
    rpc_1.sdk(options, query_1.QueryClientImpl, tx_1.MsgClientImpl, CrudMsgTypes, cs),
    rpc_1.sdk(options, query_2.QueryClientImpl, tx_2.MsgClientImpl, NftMsgTypes, cs)
]))
    .then(([db, nft]) => ({
    db, nft
}));
exports.bluzelle = bluzelle;
// Promise.resolve(bluzelle({
//     mnemonic: "focus ill drift swift blood bitter move grace ensure diamond year tongue hint weekend bulb rebel avoid gas dose print remove receive yellow shoot",
//     url: "http://localhost:26657",
//     gasPrice: 0.002,
//     maxGas: 1000000
// }))
//     .then(passThroughAwait(sdk => sdk.db.tx.Create({
//         uuid: 'uuid2',
//         key: 'foo',
//         value: new TextEncoder().encode('bar'),
//         creator: sdk.db.address,
//         lease: Long.fromInt(10),
//         metadata: new Uint8Array()
//     })))
//     .then(sdk => sdk.db.q.CrudValue({
//         uuid: 'uuid2',
//         key: 'foo'
//     }))
//     .then(x => x);
//# sourceMappingURL=bz-sdk.js.map