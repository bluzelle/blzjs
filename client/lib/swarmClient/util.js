"use strict";
//
// Copyright (C) 2020 Bluzelle
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = __importDefault(require("crypto"));
const bn_js_1 = __importDefault(require("bn.js"));
const EC = require('elliptic').ec;
const secp256k1 = new EC('secp256k1');
exports.BLOCK_TIME_IN_SECONDS = 5;
exports.hash = (hash, data) => crypto_1.default.createHash(hash)
    .update(data)
    .digest();
exports.convertSignature = (sig) => {
    let r = new bn_js_1.default(sig.r);
    if (r.cmp(secp256k1.curve.n) >= 0) {
        r = new bn_js_1.default(0);
    }
    let s = new bn_js_1.default(sig.s);
    if (s.cmp(secp256k1.curve.n) >= 0) {
        s = new bn_js_1.default(0);
    }
    return Buffer.concat([
        r.toArrayLike(Buffer, 'be', 32),
        s.toArrayLike(Buffer, 'be', 32),
    ]);
};
exports.sortJson = (obj) => {
    if (obj === null ||
        ['undefined', 'string', 'number', 'boolean', 'function'].includes(typeof obj)) {
        return obj;
    }
    if (Array.isArray(obj)) {
        return obj.sort().map(i => exports.sortJson(i));
    }
    else {
        let sortedObj = {};
        Object.keys(obj)
            .sort()
            .forEach((key) => {
            sortedObj[key] = exports.sortJson(obj[key]);
        });
        return sortedObj;
    }
};
const MINUTE = 60;
const HOUR = MINUTE * 60;
const DAY = HOUR * 24;
exports.convertLease = ({ seconds = 0, minutes = 0, hours = 0, days = 0 }) => (seconds + (minutes * MINUTE) + (hours * HOUR) + (days * DAY)) / exports.BLOCK_TIME_IN_SECONDS;
exports.encodeSafe = (str) => encodeURI(str)
    .replace(/([\#\?])/g, ch => `%${ch.charCodeAt(0).toString(16)}`);
//# sourceMappingURL=util.js.map