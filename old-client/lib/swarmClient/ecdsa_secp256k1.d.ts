/// <reference types="node" />
export declare const verify: (msg_bin: Buffer, sig_bin: Buffer, pub_key_base64: string) => any;
export declare const sign: (msg_bin: Buffer, priv_key_base64: string) => any;
export declare const pub_from_priv: (priv_key_base64: string) => string;
export declare const import_public_key_from_base64: (pub_key_base64: string) => any;
export declare const import_private_key_from_base64: (priv_key_base64: string) => any;
export declare const get_pem_private_key: (ec: any) => string;
//# sourceMappingURL=ecdsa_secp256k1.d.ts.map