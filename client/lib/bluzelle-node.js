"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadNft = exports.bluzelle = exports.mnemonicToAddress = exports.API = void 0;
const API_1 = require("./API");
const lodash_1 = require("lodash");
const promise_passthrough_1 = require("promise-passthrough");
const js_sha256_1 = require("js-sha256");
var API_2 = require("./API");
Object.defineProperty(exports, "API", { enumerable: true, get: function () { return API_2.API; } });
var API_3 = require("./API");
Object.defineProperty(exports, "mnemonicToAddress", { enumerable: true, get: function () { return API_3.mnemonicToAddress; } });
const splitDataIntoChunks = (data, chunkSize = 500 * 1024) => Promise.all(lodash_1.times(Math.ceil(data.byteLength / chunkSize)).map(chunkNum => new Promise(resolve => setTimeout(() => resolve(data.slice(chunkSize * chunkNum, chunkSize * chunkNum + chunkSize))))));
const bluzelle = (config) => new API_1.API(config);
exports.bluzelle = bluzelle;
const uploadNft = (url, data, vendor, cb) => splitDataIntoChunks(data)
    .then(chunks => ({ data, chunks }))
    .then(ctx => ({ ...ctx, hash: js_sha256_1.sha256(ctx.data) }))
    .then(promise_passthrough_1.passThroughAwait(ctx => Promise.all(ctx.chunks.map((chunk, chunkNum) => fetch(`${url}/nft/upload/${vendor}/${ctx.hash}/${chunkNum}`, {
    method: 'POST',
    body: chunk
})
    .then(promise_passthrough_1.passThrough(() => cb && cb(chunkNum, ctx.chunks.length)))))))
    .then(({ hash, mimeType }) => ({
    hash, mimeType
}));
exports.uploadNft = uploadNft;
//# sourceMappingURL=bluzelle-node.js.map