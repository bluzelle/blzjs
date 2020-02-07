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

import {createHash} from 'crypto'

const BN = require('bn.js');

import {ec} from 'elliptic'

const secp256k1 = new ec('secp256k1')

const hash = (hash, data) =>
    createHash(hash)
        .update(data)
        .digest()

const convertSignature = sig =>
{
    let r = new BN(sig.r)

    if (r.cmp(secp256k1.curve.n) >= 0)
    {
        r = new BN(0)
    }

    let s = new BN(sig.s)
    if (s.cmp(secp256k1.curve.n) >= 0)
    {
        s = new BN(0)
    }

    return Buffer.concat([
        r.toArrayLike(Buffer, 'be', 32),
        s.toArrayLike(Buffer, 'be', 32),
    ])
}

const sortJson = obj =>
{
    if (
        obj === null ||
        ~['undefined', 'string', 'number', 'boolean', 'function'].indexOf(
            typeof obj
        )
    )
    {
        return obj
    }

    if (Array.isArray(obj))
    {
        return obj.sort().map(i => sortJson(i))
    }
    else
    {
        let sortedObj = {}

        Object.keys(obj)
            .sort()
            .forEach(key =>
            {
                sortedObj[key] = sortJson(obj[key])
            })

        return sortedObj
    }
}

export
{
    hash,
    convertSignature,
    sortJson,
}