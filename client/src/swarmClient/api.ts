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


import {GasInfo} from "../GasInfo";
import {LeaseInfo} from "../LeaseInfo";
import {AccountInfo} from "../AccountInfo";
import {ClientErrors} from "./ClientErrors";
import {isString} from 'lodash'
import {BLOCK_TIME_IN_SECONDS} from "./util";
import {convertLease} from "./util";
import {encodeSafe} from "./util";

import assert from 'assert'
import * as cosmos from './cosmos'

const APP_SERVICE = "crud";

function hex2string(hex: string): string {
    let str = '';
    for (let i = 0; i < hex.length; i += 2)
        str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    return str;
}

const parse_result = (str: string) => JSON.parse(hex2string(str));

export class API {
    mnemonic: string;
    address: string;
    uuid: string;
    chain_id: string;
    endpoint: string;

    constructor(address: string, mnemonic: string, endpoint: string, uuid: string, chain_id: string) {
        assert(isString(address), ClientErrors.ADDRESS_MUST_BE_A_STRING);
        assert(isString(mnemonic), ClientErrors.MNEMONIC_MUST_BE_A_STRING);

        this.mnemonic = mnemonic;
        this.address = address;
        this.uuid = uuid;
        this.chain_id = chain_id || "bluzelle";
        this.endpoint = endpoint || "http://localhost:1317";
    }

    async init(): Promise<void> {
        return cosmos.init(this.mnemonic, this.endpoint, this.address);
    }

    status(): void {
        console.log("status");
    }

    async create(key: string, value: string, gas_info: GasInfo, lease_info: LeaseInfo = {}): Promise<void> {
        assert(isString(key), ClientErrors.KEY_MUST_BE_A_STRING);
        assert(isString(value), ClientErrors.VALUE_MUST_BE_A_STRING);

        const blocks = convertLease(lease_info);

        if (blocks < 0) {
            throw new Error(ClientErrors.INVALID_LEASE_TIME);
        }

        return this.do_tx({
            Key: key,
            Value: value,
            Lease: blocks.toString()
        }, 'post', 'create', gas_info);
    }

    update(key: string, value: string, gas_info: GasInfo, lease_info?: LeaseInfo): Promise<void> {
        assert(isString(key), ClientErrors.KEY_MUST_BE_A_STRING);
        assert(isString(value), ClientErrors.VALUE_MUST_BE_A_STRING);

        return this.do_tx({
            Key: key,
            Value: value,
            Lease: convertLease(lease_info = {}).toString()
        }, 'post', 'update', gas_info);
    }

    read(key: string, prove?: string): Promise<string> {
        assert(isString(key), ClientErrors.KEY_MUST_BE_A_STRING);

        const uri_key = encodeSafe(key);
        const url = prove ? `${APP_SERVICE}/pread/${this.uuid}/${uri_key}` : `${APP_SERVICE}/read/${this.uuid}/${uri_key}`;
        return cosmos.query(url)
            .then(res => res.result.value)
            .catch(err => {
            // treat 404's specially
            if (err.message.substr(0, 3) === '404') {
                throw new Error(ClientErrors.KEY_DOES_NOTE_EXIST);
            } else {
                throw err;
            }
        });
    }

    async txRead(key: string, gas_info: GasInfo): Promise<string> {
        assert(isString(key), ClientErrors.KEY_MUST_BE_A_STRING);

        return this.do_tx({
            Key: key
        }, 'post', 'read', gas_info).then(res => parse_result(res).value);
    }

    async delete(key: string, gas_info: GasInfo): Promise<void> {
        assert(isString(key), ClientErrors.KEY_MUST_BE_A_STRING);

        return this.do_tx({
            Key: key
        }, 'delete', 'delete', gas_info);
    }

    async has(key: string): Promise<boolean> {
        assert(isString(key), ClientErrors.KEY_MUST_BE_A_STRING);

        const uri_key = encodeSafe(key);
        return cosmos.query(`${APP_SERVICE}/has/${this.uuid}/${uri_key}`).then(({result}) => result.has);
    }

    txHas(key: string, gas_info: GasInfo): Promise<boolean> {
        assert(isString(key), ClientErrors.KEY_MUST_BE_A_STRING);

        return this.do_tx({
            Key: key
        }, 'post', 'has', gas_info).then(res =>
            parse_result(res).has
        );
    }

    async keys(): Promise<string[]> {
        return cosmos.query(`${APP_SERVICE}/keys/${this.uuid}`).then(({result}) => result.keys || []);
    }

    txKeys(gas_info: GasInfo): Promise<string[]> {
        return this.do_tx({}, 'post', 'keys', gas_info).then(res =>
            parse_result(res).keys || []
        );
    }

    rename(key: string, new_key: string, gas_info: GasInfo): Promise<boolean> {
        assert(isString(key), ClientErrors.KEY_MUST_BE_A_STRING);
        assert(isString(new_key), ClientErrors.NEW_KEY_MUST_BE_A_STRING);

        return this.do_tx({
            Key: key,
            NewKey: new_key
        }, 'post', 'rename', gas_info);
    }

    count(): Promise<number> {
        return cosmos.query(`/${APP_SERVICE}/count/${this.uuid}`).then(({result}) => parseInt(result.count));
    }

    txCount(gas_info: GasInfo): Promise<number> {
        return this.do_tx({}, 'post', 'count', gas_info).then(res =>
            parseInt(parse_result(res).count)
        );
    }

    deleteAll(gas_info: GasInfo):Promise<void> {
        return this.do_tx({}, 'post', 'deleteall', gas_info);
    }

    keyValues(): Promise<{key: string, value: string}[]> {
        return cosmos.query(`/${APP_SERVICE}/keyvalues/${this.uuid}`).then(({result}) => result.keyvalues)
    }

    txKeyValues(gas_info: GasInfo): Promise<{key: string, value: string}[]> {
        return this.do_tx({}, 'post', 'keyvalues', gas_info).then(res =>
            parse_result(res).keyvalues
        );
    }

    async multiUpdate(keyvalues: {key: string, value: string}[], gas_info: GasInfo): Promise<void> {
        assert(typeof keyvalues === 'object', 'Keyvalues must be an array');
        keyvalues.forEach(({key, value}, index, array) => {
            assert(isString(key), ClientErrors.ALL_KEYS_MUST_BE_STRINGS);
            assert(isString(value), ClientErrors.ALL_VALUES_MUST_BE_STRINGS);
        });

        return this.do_tx({
            KeyValues: keyvalues
        }, 'post', 'multiupdate', gas_info);
    }

    async getLease(key: string): Promise<number> {
        assert(isString(key), ClientErrors.KEY_MUST_BE_A_STRING);

        const uri_key = encodeSafe(key);
        return cosmos.query(`${APP_SERVICE}/getlease/${this.uuid}/${uri_key}`).then(({result}) => result.lease * BLOCK_TIME_IN_SECONDS);
    }

    txGetLease(key: string, gas_info: GasInfo): Promise<number> {
        assert(isString(key), ClientErrors.KEY_MUST_BE_A_STRING);

        return this.do_tx({
            Key: key
        }, 'post', 'getlease', gas_info).then(res =>
            parse_result(res).lease * BLOCK_TIME_IN_SECONDS
        );
    }

    renewLease(key: string, gas_info: GasInfo, lease_info: LeaseInfo): Promise<number> {
        assert(isString(key), ClientErrors.KEY_MUST_BE_A_STRING);

        const blocks = convertLease(lease_info);
        if (blocks < 0) {
            throw new Error(ClientErrors.INVALID_LEASE_TIME);
        }

        return this.do_tx({
            Key: key,
            Lease: blocks.toString()
        }, 'post', 'renewlease', gas_info);
    }

    renewLeaseAll(gas_info: GasInfo, lease_info: LeaseInfo = {}): Promise<number> {
        const blocks = convertLease(lease_info);
        if (blocks < 0) {
            throw new Error(ClientErrors.INVALID_LEASE_TIME);
        }

        return this.do_tx({
            Lease: blocks.toString()
        }, 'post', 'renewleaseall', gas_info);
    }

    async getNShortestLeases(n: number): Promise<{key: string, lease: {seconds: number}}[]> {
        if (n < 0) {
            throw new Error(ClientErrors.INVALID_VALUE_SPECIFIED);
        }

        return cosmos.query(`${APP_SERVICE}/getnshortestleases/${this.uuid}/${n}`).then(({result}) => {
            return result.keyleases.map(({key, lease}: {key: string, lease: string}) => ({key, lease: parseInt(lease) * BLOCK_TIME_IN_SECONDS}));
        })
    }

    txGetNShortestLeases(n: number, gas_info: GasInfo): Promise<{key: string, lease: {seconds: number}}[]> {
        assert(n >= 0, ClientErrors.INVALID_VALUE_SPECIFIED);

        return this.do_tx(
            {
                N: n
            }, 'post', 'getnshortestleases', gas_info).then(res => {
            const result = parse_result(res);
            return result.keyleases.map(({key, lease}: {key: string, lease: string}) => ({key, lease: parseInt(lease) * BLOCK_TIME_IN_SECONDS}));
        });
    }


    async account(): Promise<AccountInfo> {
        return cosmos.query(`auth/accounts/${this.address}`).then(({result}) => result.value);
    }

    async version(): Promise<string> {
        return cosmos.query('node_info').then(res => res.application_version.version);
    }

    private do_tx(params: {[key: string]: any}, type: 'post' | 'delete', cmd: string, gas_info: GasInfo) {
        const data = {
            BaseReq: {
                from: this.address,
                chain_id: this.chain_id
            },
            UUID: this.uuid,
            Owner: this.address,
            ...params
        };

        return cosmos.send_transaction(type, `${APP_SERVICE}/${cmd}`, data, gas_info);
    }
}
