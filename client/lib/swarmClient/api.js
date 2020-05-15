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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
const util_1 = require("./util");
const util_2 = require("./util");
const util_3 = require("./util");
const assert_1 = __importDefault(require("assert"));
const cosmos = __importStar(require("./cosmos"));
const APP_SERVICE = "crud";
function hex2string(hex) {
    let str = '';
    for (let i = 0; i < hex.length; i += 2)
        str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    return str;
}
const parse_result = (str) => JSON.parse(hex2string(str));
class API {
    constructor({ mnemonic, endpoint, uuid, chain_id }) {
        this.address = '';
        assert_1.default(lodash_1.isString(mnemonic), "mnemonic must be a string" /* MNEMONIC_MUST_BE_A_STRING */);
        assert_1.default(lodash_1.isString(uuid), "uuid must be a string" /* UUID_MUST_BE_A_STRING */);
        this.mnemonic = mnemonic;
        this.uuid = uuid;
        this.chain_id = chain_id || "bluzelle";
        this.endpoint = endpoint || "http://localhost:1317";
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            this.address = yield cosmos.init(this.mnemonic, this.endpoint);
        });
    }
    status() {
        console.log("status");
    }
    create(key, value, gas_info, lease_info = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            assert_1.default(lodash_1.isString(key), "Key must be a string" /* KEY_MUST_BE_A_STRING */);
            assert_1.default(lodash_1.isString(value), "Value must be a string" /* VALUE_MUST_BE_A_STRING */);
            const blocks = util_2.convertLease(lease_info);
            assert_1.default(blocks >= 0, "Invalid lease time" /* INVALID_LEASE_TIME */);
            return this.doTx({
                Key: key,
                Value: value,
                Lease: blocks.toString()
            }, 'post', 'create', gas_info);
        });
    }
    update(key, value, gas_info, lease_info) {
        return __awaiter(this, void 0, void 0, function* () {
            assert_1.default(lodash_1.isString(key), "Key must be a string" /* KEY_MUST_BE_A_STRING */);
            assert_1.default(lodash_1.isString(value), "Value must be a string" /* VALUE_MUST_BE_A_STRING */);
            return this.doTx({
                Key: key,
                Value: value,
                Lease: util_2.convertLease(lease_info = {}).toString()
            }, 'post', 'update', gas_info);
        });
    }
    read(key, prove) {
        return __awaiter(this, void 0, void 0, function* () {
            assert_1.default(lodash_1.isString(key), "Key must be a string" /* KEY_MUST_BE_A_STRING */);
            return cosmos.query(`${APP_SERVICE}/${prove ? 'pread' : 'read'}/${this.uuid}/${util_3.encodeSafe(key)}`)
                .then(res => res.result.value);
        });
    }
    txRead(key, gas_info) {
        return __awaiter(this, void 0, void 0, function* () {
            assert_1.default(lodash_1.isString(key), "Key must be a string" /* KEY_MUST_BE_A_STRING */);
            return this.doTx({
                Key: key
            }, 'post', 'read', gas_info).then(res => parse_result(res).value);
        });
    }
    delete(key, gas_info) {
        return __awaiter(this, void 0, void 0, function* () {
            assert_1.default(lodash_1.isString(key), "Key must be a string" /* KEY_MUST_BE_A_STRING */);
            return this.doTx({
                Key: key
            }, 'delete', 'delete', gas_info);
        });
    }
    has(key) {
        return __awaiter(this, void 0, void 0, function* () {
            assert_1.default(lodash_1.isString(key), "Key must be a string" /* KEY_MUST_BE_A_STRING */);
            const uri_key = util_3.encodeSafe(key);
            return cosmos.query(`${APP_SERVICE}/has/${this.uuid}/${uri_key}`).then(({ result }) => result.has);
        });
    }
    txHas(key, gas_info) {
        return __awaiter(this, void 0, void 0, function* () {
            assert_1.default(lodash_1.isString(key), "Key must be a string" /* KEY_MUST_BE_A_STRING */);
            return this.doTx({
                Key: key
            }, 'post', 'has', gas_info).then(res => parse_result(res).has);
        });
    }
    keys() {
        return __awaiter(this, void 0, void 0, function* () {
            return cosmos.query(`${APP_SERVICE}/keys/${this.uuid}`).then(({ result }) => result.keys || []);
        });
    }
    txKeys(gas_info) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.doTx({}, 'post', 'keys', gas_info).then(res => parse_result(res).keys || []);
        });
    }
    rename(key, new_key, gas_info) {
        return __awaiter(this, void 0, void 0, function* () {
            assert_1.default(lodash_1.isString(key), "Key must be a string" /* KEY_MUST_BE_A_STRING */);
            assert_1.default(lodash_1.isString(new_key), "New key must be a string" /* NEW_KEY_MUST_BE_A_STRING */);
            return this.doTx({
                Key: key,
                NewKey: new_key
            }, 'post', 'rename', gas_info);
        });
    }
    count() {
        return __awaiter(this, void 0, void 0, function* () {
            return cosmos.query(`/${APP_SERVICE}/count/${this.uuid}`)
                .then(({ result }) => parseInt(result.count));
        });
    }
    txCount(gas_info) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.doTx({}, 'post', 'count', gas_info).then(res => parseInt(parse_result(res).count));
        });
    }
    deleteAll(gas_info) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.doTx({}, 'post', 'deleteall', gas_info);
        });
    }
    keyValues() {
        return __awaiter(this, void 0, void 0, function* () {
            return cosmos.query(`/${APP_SERVICE}/keyvalues/${this.uuid}`).then(({ result }) => result.keyvalues);
        });
    }
    txKeyValues(gas_info) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.doTx({}, 'post', 'keyvalues', gas_info).then(res => parse_result(res).keyvalues);
        });
    }
    multiUpdate(keyvalues, gas_info) {
        return __awaiter(this, void 0, void 0, function* () {
            assert_1.default(Array.isArray(keyvalues), 'keyvalues must be an array');
            keyvalues.forEach(({ key, value }, index, array) => {
                assert_1.default(lodash_1.isString(key), "All keys must be strings" /* ALL_KEYS_MUST_BE_STRINGS */);
                assert_1.default(lodash_1.isString(value), "All values must be strings" /* ALL_VALUES_MUST_BE_STRINGS */);
            });
            return this.doTx({
                KeyValues: keyvalues
            }, 'post', 'multiupdate', gas_info);
        });
    }
    getLease(key) {
        return __awaiter(this, void 0, void 0, function* () {
            assert_1.default(lodash_1.isString(key), "Key must be a string" /* KEY_MUST_BE_A_STRING */);
            const uri_key = util_3.encodeSafe(key);
            return cosmos.query(`${APP_SERVICE}/getlease/${this.uuid}/${uri_key}`).then(({ result }) => result.lease * util_1.BLOCK_TIME_IN_SECONDS);
        });
    }
    txGetLease(key, gas_info) {
        return __awaiter(this, void 0, void 0, function* () {
            assert_1.default(lodash_1.isString(key), "Key must be a string" /* KEY_MUST_BE_A_STRING */);
            return this.doTx({
                Key: key
            }, 'post', 'getlease', gas_info).then(res => parse_result(res).lease * util_1.BLOCK_TIME_IN_SECONDS);
        });
    }
    renewLease(key, gas_info, lease_info) {
        return __awaiter(this, void 0, void 0, function* () {
            assert_1.default(lodash_1.isString(key), "Key must be a string" /* KEY_MUST_BE_A_STRING */);
            const blocks = util_2.convertLease(lease_info);
            assert_1.default(blocks >= 0, "Invalid lease time" /* INVALID_LEASE_TIME */);
            return this.doTx({
                Key: key,
                Lease: blocks.toString()
            }, 'post', 'renewlease', gas_info);
        });
    }
    renewLeaseAll(gas_info, lease_info = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            const blocks = util_2.convertLease(lease_info);
            assert_1.default(blocks >= 0, "Invalid lease time" /* INVALID_LEASE_TIME */);
            return this.doTx({
                Lease: blocks.toString()
            }, 'post', 'renewleaseall', gas_info);
        });
    }
    getNShortestLeases(n) {
        return __awaiter(this, void 0, void 0, function* () {
            assert_1.default(n >= 0, Error("Invalid value specified" /* INVALID_VALUE_SPECIFIED */));
            return cosmos.query(`${APP_SERVICE}/getnshortestleases/${this.uuid}/${n}`).then(({ result }) => {
                return result.keyleases.map(({ key, lease }) => ({ key, lease: parseInt(lease) * util_1.BLOCK_TIME_IN_SECONDS }));
            });
        });
    }
    txGetNShortestLeases(n, gas_info) {
        return __awaiter(this, void 0, void 0, function* () {
            assert_1.default(n >= 0, "Invalid value specified" /* INVALID_VALUE_SPECIFIED */);
            return this.doTx({
                N: n
            }, 'post', 'getnshortestleases', gas_info).then(res => {
                const result = parse_result(res);
                return result.keyleases.map(({ key, lease }) => ({ key, lease: parseInt(lease) * util_1.BLOCK_TIME_IN_SECONDS }));
            });
        });
    }
    account() {
        return __awaiter(this, void 0, void 0, function* () {
            return cosmos.query(`auth/accounts/${this.address}`).then(({ result }) => result.value);
        });
    }
    version() {
        return __awaiter(this, void 0, void 0, function* () {
            return cosmos.query('node_info').then(res => res.application_version.version);
        });
    }
    doTx(params, type, cmd, gas_info) {
        const data = Object.assign({ BaseReq: {
                from: this.address,
                chain_id: this.chain_id
            }, UUID: this.uuid, Owner: this.address }, params);
        return cosmos.sendTransaction(type, `${APP_SERVICE}/${cmd}`, data, gas_info);
    }
}
exports.API = API;
//# sourceMappingURL=Api.js.map