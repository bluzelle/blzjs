"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert_1 = __importDefault(require("assert"));
const ecdsa_secp256k1_1 = require("./ecdsa_secp256k1");
const chai_1 = require("chai");
describe('ECDSA Verification', () => {
    let msg_base64;
    let sig_base64;
    let pub_key_base64;
    // How to generate these test cases with OpenSSL:
    // > openssl ecparam -name secp256k1 -genkey -noout -out alice_priv_key.pem
    // > openssl ec -in alice_priv_key.pem -pubout -out alice_pub_key.pem
    // > echo "my secret message" > msg.txt
    // > openssl dgst -sha256 -sign alice_priv_key.pem msg.txt > signature.bin
    // > openssl base64 < msg.txt
    // > openssl base64 < signature.bin
    // pub_key_base64 is embedded inside alice_pub_key.pem
    it('1', () => {
        msg_base64 = "ZG9uYWxkIHRydW1wIGlzIHRoZSBiZXN0Cg==";
        sig_base64 = "MEYCIQCHkESsvomyxnjc3GG8hr619ZdRuP3CNG52DVjwATD5qAIhANLp3FRrr7+Se1a9DiwndLxaroLUF6bGpPX/j/6oJKgx";
        pub_key_base64 = "MFYwEAYHKoZIzj0CAQYFK4EEAAoDQgAEY7jTcTgJy+vW1Jl+vXw6Ful9qRwqAOQY0lRu+kgp6i1Y7eTviDIW80AxItNvTz25vyfW64uo0KAtKrW0WKQeyg==";
        f();
    });
    it('2', () => {
        msg_base64 = "aSBob3BlIG5vYm9keSByZWFkcyB0aGlzCg==";
        sig_base64 = "MEQCIESUT3lwahQjzoXxHzivhMdQqI4hlTgbseQlfsRz8GjTAiAaGyUVhiyQgZd1YXOstXC/5fG4cCK2NhESLkfMwwChTg==";
        pub_key_base64 = "MFYwEAYHKoZIzj0CAQYFK4EEAAoDQgAEY7jTcTgJy+vW1Jl+vXw6Ful9qRwqAOQY0lRu+kgp6i1Y7eTviDIW80AxItNvTz25vyfW64uo0KAtKrW0WKQeyg==";
        f();
    });
    const f = () => {
        const msg_bin = Buffer.from(msg_base64, 'base64');
        const sig_bin = Buffer.from(sig_base64, 'base64');
        assert_1.default(ecdsa_secp256k1_1.verify(msg_bin, sig_bin, pub_key_base64));
        // Mutate signature 
        sig_bin[43] += 1;
        assert_1.default(!ecdsa_secp256k1_1.verify(msg_bin, sig_bin, pub_key_base64));
    };
});
describe('ECDSA Signing', () => {
    let msg_base64;
    let priv_key_base64;
    it('1', () => {
        msg_base64 = "ChQKEEJlc3REYXRhYmFzZUV2ZXIQKiIqCghzb21lIGtleRIedmVyeSBpbXBvcnRhbnQgZGF0YSBhbmQgc3R1ZmZz";
        priv_key_base64 = "MHQCAQEEIJGS3Ehg1rsVG5MKIfPZ/hWOoBR6hwfWCeQ6cNvSZqWGoAcGBSuBBAAKoUQDQgAEgWZh744sleHAQFvLz3vNFXeE27KMNMjtZqdPfw4kapIIHXSMpyTgvrN3g2hTc3Iaf4ZkuOVJKwwIjTMMgpyC0g==";
        f();
    });
    it('2', () => {
        msg_base64 = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.";
        priv_key_base64 = "MHQCAQEEID1CnLSlzpRdv0JT9B9zTLAtQ3U75tgaF1zdkJbRCMF/oAcGBSuBBAAKoUQDQgAEOXPEdTs23dLC+DhWxoYX6TAft/Y3zXRfdAZi/VpFsmkI042sbF1uxQ3APtfFNmPFYlBW7blw/BisrkPPJFCxEQ==";
        f();
    });
    it('3', () => {
        msg_base64 = "120|MFYwEAYHKoZIzj0CAQYFK4EEAAoDQgAE2FcxJdkJ+nrjhkDRiPQ6mFf5OOAKeWedOukyim0UveUVt0CvE1UAQHTBlQLN2CRhiKdStOduOU6IjCYcFdX+rg==2|100|1|0";
        priv_key_base64 = "MHQCAQEEIPf6MgiFUbvtT+wLCDKrFdO6QPOb9S4lbrhsF3DOhOjhoAcGBSuBBAAKoUQDQgAE2FcxJdkJ+nrjhkDRiPQ6mFf5OOAKeWedOukyim0UveUVt0CvE1UAQHTBlQLN2CRhiKdStOduOU6IjCYcFdX+rg==";
        f();
    });
    const f = () => {
        const msg_bin = Buffer.from(msg_base64, 'base64');
        const sig_bin = ecdsa_secp256k1_1.sign(msg_bin, priv_key_base64);
        const pub_key_base64 = ecdsa_secp256k1_1.pub_from_priv(priv_key_base64);
        assert_1.default(ecdsa_secp256k1_1.verify(msg_bin, sig_bin, pub_key_base64));
        // Mutate signature 
        sig_bin[43] += 1;
        assert_1.default(!ecdsa_secp256k1_1.verify(msg_bin, sig_bin, pub_key_base64));
    };
});
describe('ECDSA Generate Public PEM from Private PEM', () => {
    it('', () => {
        const priv_key_base64 = "MHQCAQEEIFNmJHEiGpgITlRwao/CDki4OS7BYeI7nyz+CM8NW3xToAcGBSuBBAAKoUQDQgAEndHOcS6bE1P9xjS/U+SM2a1GbQpPuH9sWNWtNYxZr0JcF+sCS2zsD+xlCcbrRXDZtfeDmgD9tHdWhcZKIy8ejQ==";
        const pub_key_base64 = "MFYwEAYHKoZIzj0CAQYFK4EEAAoDQgAEndHOcS6bE1P9xjS/U+SM2a1GbQpPuH9sWNWtNYxZr0JcF+sCS2zsD+xlCcbrRXDZtfeDmgD9tHdWhcZKIy8ejQ==";
        const pub = ecdsa_secp256k1_1.pub_from_priv(priv_key_base64);
        chai_1.expect(pub).to.equal(pub_key_base64);
    });
});
describe('ECDSA Generate Private PEM', () => {
    it('', () => {
        const priv_key_base64 = "MHQCAQEEIFNmJHEiGpgITlRwao/CDki4OS7BYeI7nyz+CM8NW3xToAcGBSuBBAAKoUQDQgAEndHOcS6bE1P9xjS/U+SM2a1GbQpPuH9sWNWtNYxZr0JcF+sCS2zsD+xlCcbrRXDZtfeDmgD9tHdWhcZKIy8ejQ==";
        const ec = ecdsa_secp256k1_1.import_private_key_from_base64(priv_key_base64);
        assert_1.default.equal(ecdsa_secp256k1_1.get_pem_private_key(ec), priv_key_base64);
    });
});
//# sourceMappingURL=ecdsa_secp256k1.test.js.map