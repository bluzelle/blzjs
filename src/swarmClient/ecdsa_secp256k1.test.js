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
const {
  verify,
  sign,
  pubFromPriv,
  importPrivateKeyFromBase64,
  getPemPrivateKey,
} = require('./ecdsa_secp256k1');

describe('ECDSA Verification', () => {
  let msgBase64;
  let sigBase64;
  let pubKeyBase64;

  // How to generate these test cases with OpenSSL:

  // > openssl ecparam -name secp256k1 -genkey -noout -out alice_priv_key.pem
  // > openssl ec -in alice_priv_key.pem -pubout -out alice_pub_key.pem

  // > echo "my secret message" > msg.txt
  // > openssl dgst -sha256 -sign alice_priv_key.pem msg.txt > signature.bin

  // > openssl base64 < msg.txt
  // > openssl base64 < signature.bin

  // pubKeyBase64 is embedded inside alice_pub_key.pem

  it('1', () => {
    msgBase64 = 'ZG9uYWxkIHRydW1wIGlzIHRoZSBiZXN0Cg=='; // eslint-disable-line max-len
    sigBase64 =
      'MEYCIQCHkESsvomyxnjc3GG8hr619ZdRuP3CNG52DVjwATD5qAIhANLp3FRrr7+Se1a9DiwndLxaroLUF6bGpPX/j/6oJKgx'; // eslint-disable-line max-len
    pubKeyBase64 =
      'MFYwEAYHKoZIzj0CAQYFK4EEAAoDQgAEY7jTcTgJy+vW1Jl+vXw6Ful9qRwqAOQY0lRu+kgp6i1Y7eTviDIW80AxItNvTz25vyfW64uo0KAtKrW0WKQeyg=='; // eslint-disable-line max-len

    f();
  });

  it('2', () => {
    msgBase64 = 'aSBob3BlIG5vYm9keSByZWFkcyB0aGlzCg=='; // eslint-disable-line max-len
    sigBase64 =
      'MEQCIESUT3lwahQjzoXxHzivhMdQqI4hlTgbseQlfsRz8GjTAiAaGyUVhiyQgZd1YXOstXC/5fG4cCK2NhESLkfMwwChTg=='; // eslint-disable-line max-len
    pubKeyBase64 =
      'MFYwEAYHKoZIzj0CAQYFK4EEAAoDQgAEY7jTcTgJy+vW1Jl+vXw6Ful9qRwqAOQY0lRu+kgp6i1Y7eTviDIW80AxItNvTz25vyfW64uo0KAtKrW0WKQeyg=='; // eslint-disable-line max-len

    f();
  });

  const f = () => {
    const msgBin = Buffer.from(msgBase64, 'base64');
    const sigBin = Buffer.from(sigBase64, 'base64');

    assert(verify(msgBin, sigBin, pubKeyBase64));

    // Mutate signature
    sigBin[43] += 1;

    assert(!verify(msgBin, sigBin, pubKeyBase64));
  };
});

describe('ECDSA Signing', () => {
  let msgBase64;
  let privKeyBase64;

  it('1', () => {
    msgBase64 =
      'ChQKEEJlc3REYXRhYmFzZUV2ZXIQKiIqCghzb21lIGtleRIedmVyeSBpbXBvcnRhbnQgZGF0YSBhbmQgc3R1ZmZz'; // eslint-disable-line max-len
    privKeyBase64 =
      'MHQCAQEEIJGS3Ehg1rsVG5MKIfPZ/hWOoBR6hwfWCeQ6cNvSZqWGoAcGBSuBBAAKoUQDQgAEgWZh744sleHAQFvLz3vNFXeE27KMNMjtZqdPfw4kapIIHXSMpyTgvrN3g2hTc3Iaf4ZkuOVJKwwIjTMMgpyC0g=='; // eslint-disable-line max-len

    f();
  });

  it('2', () => {
    msgBase64 =
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'; // eslint-disable-line max-len
    privKeyBase64 =
      'MHQCAQEEID1CnLSlzpRdv0JT9B9zTLAtQ3U75tgaF1zdkJbRCMF/oAcGBSuBBAAKoUQDQgAEOXPEdTs23dLC+DhWxoYX6TAft/Y3zXRfdAZi/VpFsmkI042sbF1uxQ3APtfFNmPFYlBW7blw/BisrkPPJFCxEQ=='; // eslint-disable-line max-len

    f();
  });

  it('3', () => {
    msgBase64 =
      '120|MFYwEAYHKoZIzj0CAQYFK4EEAAoDQgAE2FcxJdkJ+nrjhkDRiPQ6mFf5OOAKeWedOukyim0UveUVt0CvE1UAQHTBlQLN2CRhiKdStOduOU6IjCYcFdX+rg==2|100|1|0'; // eslint-disable-line max-len
    privKeyBase64 =
      'MHQCAQEEIPf6MgiFUbvtT+wLCDKrFdO6QPOb9S4lbrhsF3DOhOjhoAcGBSuBBAAKoUQDQgAE2FcxJdkJ+nrjhkDRiPQ6mFf5OOAKeWedOukyim0UveUVt0CvE1UAQHTBlQLN2CRhiKdStOduOU6IjCYcFdX+rg=='; // eslint-disable-line max-len

    f();
  });

  const f = () => {
    const msgBin = Buffer.from(msgBase64, 'base64');
    const sigBin = sign(msgBin, privKeyBase64);
    const pubKeyBase64 = pubFromPriv(privKeyBase64);

    assert(verify(msgBin, sigBin, pubKeyBase64));

    // Mutate signature
    sigBin[43] += 1;

    assert(!verify(msgBin, sigBin, pubKeyBase64));
  };
});

describe('ECDSA Generate Public PEM from Private PEM', () => {
  it('', () => {
    const privKeyBase64 =
      'MHQCAQEEIFNmJHEiGpgITlRwao/CDki4OS7BYeI7nyz+CM8NW3xToAcGBSuBBAAKoUQDQgAEndHOcS6bE1P9xjS/U+SM2a1GbQpPuH9sWNWtNYxZr0JcF+sCS2zsD+xlCcbrRXDZtfeDmgD9tHdWhcZKIy8ejQ=='; // eslint-disable-line max-len
    // eslint-disable-next-line max-len
    // const pubKeyBase64 = 'MFYwEAYHKoZIzj0CAQYFK4EEAAoDQgAEndHOcS6bE1P9xjS/U+SM2a1GbQpPuH9sWNWtNYxZr0JcF+sCS2zsD+xlCcbrRXDZtfeDmgD9tHdWhcZKIy8ejQ==';

    pubFromPriv(privKeyBase64);
  });
});

describe('ECDSA Generate Private PEM', () => {
  it('', () => {
    const privKeyBase64 =
      'MHQCAQEEIFNmJHEiGpgITlRwao/CDki4OS7BYeI7nyz+CM8NW3xToAcGBSuBBAAKoUQDQgAEndHOcS6bE1P9xjS/U+SM2a1GbQpPuH9sWNWtNYxZr0JcF+sCS2zsD+xlCcbrRXDZtfeDmgD9tHdWhcZKIy8ejQ=='; // eslint-disable-line max-len

    const ec = importPrivateKeyFromBase64(privKeyBase64);

    assert.equal(getPemPrivateKey(ec), privKeyBase64);
  });
});
