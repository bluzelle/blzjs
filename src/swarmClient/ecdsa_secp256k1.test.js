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
const { verify, sign, pub_from_priv, import_private_key_from_base64, get_pem_private_key } = require('./ecdsa_secp256k1');


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

        assert(verify(msg_bin, sig_bin, pub_key_base64));


        // Mutate signature 
        sig_bin[43] += 1;

        assert(!verify(msg_bin, sig_bin, pub_key_base64));

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

        const sig_bin = sign(msg_bin, priv_key_base64);


        const pub_key_base64 = pub_from_priv(priv_key_base64);

        assert(verify(msg_bin, sig_bin, pub_key_base64));

        // Mutate signature 
        sig_bin[43] += 1;

        assert(!verify(msg_bin, sig_bin, pub_key_base64));

    };

});




describe('ECDSA Generate Public PEM from Private PEM', () => {

    it('', () => {

        const priv_key_base64 = "MHQCAQEEIFNmJHEiGpgITlRwao/CDki4OS7BYeI7nyz+CM8NW3xToAcGBSuBBAAKoUQDQgAEndHOcS6bE1P9xjS/U+SM2a1GbQpPuH9sWNWtNYxZr0JcF+sCS2zsD+xlCcbrRXDZtfeDmgD9tHdWhcZKIy8ejQ==";
        const pub_key_base64 = "MFYwEAYHKoZIzj0CAQYFK4EEAAoDQgAEndHOcS6bE1P9xjS/U+SM2a1GbQpPuH9sWNWtNYxZr0JcF+sCS2zsD+xlCcbrRXDZtfeDmgD9tHdWhcZKIy8ejQ==";

        const pub = pub_from_priv(priv_key_base64);

    });

});


describe('ECDSA Generate Private PEM', () => {

    it('', () => {

        const priv_key_base64 = "MHQCAQEEIFNmJHEiGpgITlRwao/CDki4OS7BYeI7nyz+CM8NW3xToAcGBSuBBAAKoUQDQgAEndHOcS6bE1P9xjS/U+SM2a1GbQpPuH9sWNWtNYxZr0JcF+sCS2zsD+xlCcbrRXDZtfeDmgD9tHdWhcZKIy8ejQ==";

        const ec = import_private_key_from_base64(priv_key_base64);


        assert.equal(get_pem_private_key(ec), priv_key_base64);

    });

}); 
