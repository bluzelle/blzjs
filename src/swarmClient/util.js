import { createHash } from 'crypto'
//import BN from 'bn'
const BN = require('bn.js');

import { ec } from 'elliptic'

const secp256k1 = new ec('secp256k1')

const hash = (hash, data) =>
    createHash(hash)
        .update(data)
        .digest()

const convertSignature = sig => {
    let r = new BN(sig.r)

    if (r.cmp(secp256k1.curve.n) >= 0) r = new BN(0)

    let s = new BN(sig.s)
    if (s.cmp(secp256k1.curve.n) >= 0) s = new BN(0)

    return Buffer.concat([
        r.toArrayLike(Buffer, 'be', 32),
        s.toArrayLike(Buffer, 'be', 32),
    ])
}

const sortJson = obj => {
    if (
        obj === null ||
        ~['undefined', 'string', 'number', 'boolean', 'function'].indexOf(
            typeof obj
        )
    ) {
        return obj
    }

    if (Array.isArray(obj)) {
        return obj.sort().map(i => sortJson(i))
    } else {
        let sortedObj = {}

        Object.keys(obj)
            .sort()
            .forEach(key => {
                sortedObj[key] = sortJson(obj[key])
            })

        return sortedObj
    }
}

export {
    hash,
    convertSignature,
    sortJson,
}