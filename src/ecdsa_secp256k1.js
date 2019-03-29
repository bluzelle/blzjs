// Copyright (C) 2019 Bluzelle
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License, version 3,
// as published by the Free Software Foundation.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program. If not, see <http://www.gnu.org/licenses/>.


const assert = require('assert');
const EC = require('elliptic').ec;
const sha256 = require('hash.js/lib/hash/sha/256');


const verify = (msg_bin, sig_bin, pub_key_base64) => {

    const ec_key = import_public_key_from_base64(pub_key_base64);

    const msg_hash = sha256().update(msg_bin).digest();


    // Signature base64 decoding handled by elliptic.

    return ec_key.verify(msg_hash, sig_bin);

};


const sign = (msg_bin, priv_key_base64) => {

    const ec_key = import_private_key_from_base64(priv_key_base64);

    const msg_hash = sha256().update(msg_bin).digest();

    const sig_bin = ec_key.sign(msg_hash).toDER();


    assert(ec_key.verify(msg_hash, sig_bin),
        "ECDSA: the produced signature cannot be self-verified.");

    return sig_bin;

};


const pub_from_priv = priv_key_base64 => {

    const ec_key = import_private_key_from_base64(priv_key_base64);

    // This is the only way we get the long-form encoding found in PEM's.

    // It returns a buffer and not base64 for God-knows why.

    const pub = ec_key.getPublic(false, 'base64');


    // Strip the first byte since those are present
    // in the base64 header we've provided.

    const pub_hex = Buffer.from(pub).toString('hex');

    return "MFYwEAYHKoZIzj0CAQYFK4EEAAoDQgAE" + 
        Buffer.from(pub_hex.substring(2), 'hex').toString('base64');

};


// Returns an elliptic key from base64 PEM encoding with braces removes

// ex. If this is your key:

// -----BEGIN PUBLIC KEY-----
// MFYwEAYHKoZIzj0CAQYFK4EEAAoDQgAE9Icrml+X41VC6HTX21HulbJo+pV1mtWn
// 4+evJAi8ZeeLEJp4xg++JHoDm8rQbGWfVM84eqnb/RVuIXqoz6F9Bg==
// -----END PUBLIC KEY-----

// We pass "MFYwEAYHKoZI..." into this function and it gives us an elliptic
// key object with x/y interpreted.


const import_public_key_from_base64 = pub_key_base64 => {


    const key_bin = Buffer.from(pub_key_base64, 'base64');

    const key_hex = key_bin.toString('hex');


    // This is a constant portion of the DER-encoding that is the same for all keys.
    
    // It encodes:

    // - 1.2.840.10045.2.1 ecPublicKey (ANSI X9.62 public key type)
    // - 1.3.132.0.10 secp256k1 (SECG (Certicom) named elliptic curve)
    // - The length and type of the remaining bitstring.

    // To derive this, take a sample secp256k1 public key from OpenSSL and run it through
    // an ASN.1 decoder such as https://lapo.it/asn1js/.

    const header = key_hex.substring(0, 46);

    assert.equal(header, "3056301006072a8648ce3d020106052b8104000a034200",
        "ECDSA Signature Verification: public key header is malformed for secp256k1. This is the public key you're trying to decode: \"" + pub_key_base64 + '"');


    const body = key_hex.substring(46, key_hex.length);

    const ec = new EC('secp256k1');


    // Decodes the body into x and y.

    return ec.keyFromPublic(body, 'hex');

};


// Like the above but for private keys.

// -----BEGIN EC PRIVATE KEY-----
// MHQCAQEEIFH0TCvEu585ygDovjHE9SxW5KztFhbm4iCVOC67h0tEoAcGBSuBBAAK
// oUQDQgAE9Icrml+X41VC6HTX21HulbJo+pV1mtWn4+evJAi8ZeeLEJp4xg++JHoD
// m8rQbGWfVM84eqnb/RVuIXqoz6F9Bg==
// -----END EC PRIVATE KEY-----


const import_private_key_from_base64 = priv_key_base64 => {


    const key_bin = Buffer.from(priv_key_base64, 'base64');

    const key_hex = key_bin.toString('hex');

     // Like the header above. This one encodes:

    // - INTEGER 1
    // - OCTET STRING (32 byte) - PRIVATE KEY
    // - OBJECT IDENTIFIER 1.3.132.0.10 secp256k1 (SECG (Certicom) named elliptic curve)
    // - PUBLIC KEY

    // specified here: https://tools.ietf.org/html/rfc5915

    const header1 = key_hex.substring(0, 14);

    assert.equal(header1, "30740201010420",
        "ECDSA Private Key Import: private key header is malformed. This is the private key you're trying to decode: \"" + priv_key_base64 + '"');

    const header2 = key_hex.substring(78, 78 + 26)


    assert.equal(header2, "a00706052b8104000aa1440342",
        "ECDSA Private Key Import: private key header is malformed. This is the private key you're trying to decode: \"" + priv_key_base64 + '"');


    const body = key_hex.substring(14, 14 + 64);

    const ec = new EC('secp256k1');


    // Decodes the body into x and y.

    return ec.keyFromPrivate(body, 'hex');

};


const get_pem_private_key = ec => {

    return Buffer.from(
            '30740201010420' + ec.getPrivate('hex') + 'a00706052b8104000aa144034200' + ec.getPublic('hex'),
            'hex').toString('base64');

};


const random_key = entropy => {

    const ecdsa = new EC('secp256k1');
    const keys = ecdsa.genKeyPair({
        entropy
    });

    return get_pem_private_key(keys);

};  

module.exports = {
    verify,
    sign,
    pub_from_priv,
    import_private_key_from_base64,
    import_public_key_from_base64,
    get_pem_private_key,
    random_key
};