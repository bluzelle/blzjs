//
// Copyright (C) 2019 Bluzelle
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

const assert = require('assert');
const EC = require('elliptic').ec;
const sha256 = require('hash.js/lib/hash/sha/256');

const verify = (msgBin, sigBin, pubKeyBase64) => {
  const ecKey = importPublicKeyFromBase64(pubKeyBase64);

  const msgHash = sha256().update(msgBin).digest();

  // Signature base64 decoding handled by elliptic.

  return ecKey.verify(msgHash, sigBin);
};

const sign = (msgBin, privKeyBase64) => {
  const ecKey = importPrivateKeyFromBase64(privKeyBase64);

  const msgHash = sha256().update(msgBin).digest();

  const sigBin = ecKey.sign(msgHash).toDER();

  assert(
    ecKey.verify(msgHash, sigBin),
    'ECDSA: the produced signature cannot be self-verified.'
  );

  return sigBin;
};

const pubFromPriv = (privKeyBase64) => {
  const ecKey = importPrivateKeyFromBase64(privKeyBase64);

  // This is the only way we get the long-form encoding found in PEM's.

  // It returns a buffer and not base64 for God-knows why.

  const pub = ecKey.getPublic(false, 'base64');

  // Strip the first byte since those are present
  // in the base64 header we've provided.

  const pubhex = Buffer.from(pub).toString('hex');

  return (
    'MFYwEAYHKoZIzj0CAQYFK4EEAAoDQgAE' +
    Buffer.from(pubhex.substring(2), 'hex').toString('base64')
  );
};

// Returns an elliptic key from base64 PEM encoding with braces removes

// ex. If this is your key:

// -----BEGIN PUBLIC KEY-----
// MFYwEAYHKoZIzj0CAQYFK4EEAAoDQgAE9Icrml+X41VC6HTX21HulbJo+pV1mtWn
// 4+evJAi8ZeeLEJp4xg++JHoDm8rQbGWfVM84eqnb/RVuIXqoz6F9Bg==
// -----END PUBLIC KEY-----

// We pass "MFYwEAYHKoZI..." into this function and it gives us an elliptic
// key object with x/y interpreted.

const importPublicKeyFromBase64 = (pubKeyBase64) => {
  const keyBin = Buffer.from(pubKeyBase64, 'base64');

  const keyHex = keyBin.toString('hex');

  // This is a constant portion of the DER-encoding that is the same for all keys.

  // It encodes:

  // - 1.2.840.10045.2.1 ecPublicKey (ANSI X9.62 public key type)
  // - 1.3.132.0.10 secp256k1 (SECG (Certicom) named elliptic curve)
  // - The length and type of the remaining bitstring.

  // To derive this, take a sample secp256k1 public key from OpenSSL and run it through
  // an ASN.1 decoder such as https://lapo.it/asn1js/.

  const header = keyHex.substring(0, 46);

  assert.equal(
    header,
    '3056301006072a8648ce3d020106052b8104000a034200',
    'ECDSA Signature Verification: public key header is malformed for secp256k1. This is the public key you\'re trying to decode: "' + // eslint-disable-line max-len
      pubKeyBase64 +
      '"'
  );

  const body = keyHex.substring(46, keyHex.length);

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

const importPrivateKeyFromBase64 = (privKeyBase64) => {
  const keyBin = Buffer.from(privKeyBase64, 'base64');
  const keyHex = keyBin.toString('hex');

  // Like the header above. This one encodes:

  // - INTEGER 1
  // - OCTET STRING (32 byte) - PRIVATE KEY
  // - OBJECT IDENTIFIER 1.3.132.0.10 secp256k1 (SECG (Certicom) named elliptic curve)
  // - PUBLIC KEY

  // specified here: https://tools.ietf.org/html/rfc5915

  const header1 = keyHex.substring(0, 14);

  assert.equal(
    header1,
    '30740201010420',
    'ECDSA Private Key Import: private key header is malformed. This is the private key you\'re trying to decode: "' +
      privKeyBase64 +
      '"'
  );

  const header2 = keyHex.substring(78, 78 + 26);

  assert.equal(
    header2,
    'a00706052b8104000aa1440342',
    'ECDSA Private Key Import: private key header is malformed. This is the private key you\'re trying to decode: "' +
      privKeyBase64 +
      '"'
  );

  const body = keyHex.substring(14, 14 + 64);

  const ec = new EC('secp256k1');

  // Decodes the body into x and y.

  return ec.keyFromPrivate(body, 'hex');
};

const getPemPrivateKey = (ec) => {
  return Buffer.from(
    '30740201010420' +
      ec.getPrivate('hex') +
      'a00706052b8104000aa144034200' +
      ec.getPublic('hex'),
    'hex'
  ).toString('base64');
};

const randomKey = (entropy) => {
  const ecdsa = new EC('secp256k1');
  const keys = ecdsa.genKeyPair({
    entropy,
  });

  return getPemPrivateKey(keys);
};

module.exports = {
  verify,
  sign,
  pubFromPriv,
  importPrivateKeyFromBase64,
  importPublicKeyFromBase64,
  getPemPrivateKey,
  randomKey,
};
