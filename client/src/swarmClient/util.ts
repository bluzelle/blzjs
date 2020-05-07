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

import crypto from 'crypto'
import BN from 'bn.js';
import {LeaseInfo} from "../LeaseInfo";
const EC = require ('elliptic').ec;

const secp256k1 = new EC('secp256k1');

export const BLOCK_TIME_IN_SECONDS = 5;


export const hash = (hash: string, data: string): Buffer =>
    crypto.createHash(hash)
        .update(data)
        .digest()

export const convertSignature = (sig: any): Buffer => {
    let r = new BN(sig.r)

    if (r.cmp(secp256k1.curve.n) >= 0) {
        r = new BN(0)
    }

    let s = new BN(sig.s)
    if (s.cmp(secp256k1.curve.n) >= 0) {
        s = new BN(0)
    }

    return Buffer.concat([
        r.toArrayLike(Buffer, 'be', 32),
        s.toArrayLike(Buffer, 'be', 32),
    ])
}

export const sortJson = (obj:any): any => {
    if (
        obj === null ||
        ['undefined', 'string', 'number', 'boolean', 'function'].includes(typeof obj)
    ) {
        return obj
    }

    if (Array.isArray(obj)) {
        return obj.sort().map(i => sortJson(i))
    } else {
        let sortedObj:any = {}

        Object.keys(obj)
            .sort()
            .forEach((key: string) => {
                sortedObj[key] = sortJson(obj[key])
            })

        return sortedObj
    }
}

const MINUTE = 60;
const HOUR = MINUTE * 60;
const DAY = HOUR * 24;

export const convertLease = ({seconds = 0, minutes = 0, hours = 0, days = 0}: LeaseInfo): number =>
    (seconds + (minutes * MINUTE) + (hours * HOUR) + (days * DAY)) / BLOCK_TIME_IN_SECONDS


export const encodeSafe = (str: string): string =>
    encodeURI(str)
        .replace(/([\#\?])/g, ch => `%${ch.charCodeAt(0).toString(16)}`);



