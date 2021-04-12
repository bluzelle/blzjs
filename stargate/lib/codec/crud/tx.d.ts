import Long from "long";
import _m0 from "protobufjs/minimal";
export declare const protobufPackage = "bluzelle.curium.crud";
/** this line is used by starport scaffolding # proto/tx/message */
export interface MsgUpsert {
    creator: string;
    uuid: string;
    key: string;
    value: Uint8Array;
    lease: Long;
    metadata: Uint8Array;
}
export interface MsgUpsertResponse {
}
export interface MsgCreate {
    creator: string;
    uuid: string;
    key: string;
    value: Uint8Array;
    lease: Long;
    metadata: Uint8Array;
}
export interface MsgCreateResponse {
}
export interface MsgUpdate {
    creator: string;
    uuid: string;
    key: string;
    value: Uint8Array;
    lease: Long;
    metadata: Uint8Array;
}
export interface MsgUpdateResponse {
}
export interface MsgDelete {
    creator: string;
    uuid: string;
    key: string;
}
export interface MsgDeleteResponse {
}
export declare const MsgUpsert: {
    encode(message: MsgUpsert, writer?: _m0.Writer): _m0.Writer;
    decode(input: _m0.Reader | Uint8Array, length?: number | undefined): MsgUpsert;
    fromJSON(object: any): MsgUpsert;
    toJSON(message: MsgUpsert): unknown;
    fromPartial(object: DeepPartial<MsgUpsert>): MsgUpsert;
};
export declare const MsgUpsertResponse: {
    encode(_: MsgUpsertResponse, writer?: _m0.Writer): _m0.Writer;
    decode(input: _m0.Reader | Uint8Array, length?: number | undefined): MsgUpsertResponse;
    fromJSON(_: any): MsgUpsertResponse;
    toJSON(_: MsgUpsertResponse): unknown;
    fromPartial(_: DeepPartial<MsgUpsertResponse>): MsgUpsertResponse;
};
export declare const MsgCreate: {
    encode(message: MsgCreate, writer?: _m0.Writer): _m0.Writer;
    decode(input: _m0.Reader | Uint8Array, length?: number | undefined): MsgCreate;
    fromJSON(object: any): MsgCreate;
    toJSON(message: MsgCreate): unknown;
    fromPartial(object: DeepPartial<MsgCreate>): MsgCreate;
};
export declare const MsgCreateResponse: {
    encode(_: MsgCreateResponse, writer?: _m0.Writer): _m0.Writer;
    decode(input: _m0.Reader | Uint8Array, length?: number | undefined): MsgCreateResponse;
    fromJSON(_: any): MsgCreateResponse;
    toJSON(_: MsgCreateResponse): unknown;
    fromPartial(_: DeepPartial<MsgCreateResponse>): MsgCreateResponse;
};
export declare const MsgUpdate: {
    encode(message: MsgUpdate, writer?: _m0.Writer): _m0.Writer;
    decode(input: _m0.Reader | Uint8Array, length?: number | undefined): MsgUpdate;
    fromJSON(object: any): MsgUpdate;
    toJSON(message: MsgUpdate): unknown;
    fromPartial(object: DeepPartial<MsgUpdate>): MsgUpdate;
};
export declare const MsgUpdateResponse: {
    encode(_: MsgUpdateResponse, writer?: _m0.Writer): _m0.Writer;
    decode(input: _m0.Reader | Uint8Array, length?: number | undefined): MsgUpdateResponse;
    fromJSON(_: any): MsgUpdateResponse;
    toJSON(_: MsgUpdateResponse): unknown;
    fromPartial(_: DeepPartial<MsgUpdateResponse>): MsgUpdateResponse;
};
export declare const MsgDelete: {
    encode(message: MsgDelete, writer?: _m0.Writer): _m0.Writer;
    decode(input: _m0.Reader | Uint8Array, length?: number | undefined): MsgDelete;
    fromJSON(object: any): MsgDelete;
    toJSON(message: MsgDelete): unknown;
    fromPartial(object: DeepPartial<MsgDelete>): MsgDelete;
};
export declare const MsgDeleteResponse: {
    encode(_: MsgDeleteResponse, writer?: _m0.Writer): _m0.Writer;
    decode(input: _m0.Reader | Uint8Array, length?: number | undefined): MsgDeleteResponse;
    fromJSON(_: any): MsgDeleteResponse;
    toJSON(_: MsgDeleteResponse): unknown;
    fromPartial(_: DeepPartial<MsgDeleteResponse>): MsgDeleteResponse;
};
/** Msg defines the Msg service. */
export interface Msg {
    /** this line is used by starport scaffolding # proto/tx/rpc */
    Upsert(request: MsgUpsert): Promise<MsgUpsertResponse>;
    Create(request: MsgCreate): Promise<MsgCreateResponse>;
    Update(request: MsgUpdate): Promise<MsgUpdateResponse>;
    Delete(request: MsgDelete): Promise<MsgDeleteResponse>;
}
export declare class MsgClientImpl implements Msg {
    private readonly rpc;
    constructor(rpc: Rpc);
    Upsert(request: MsgUpsert): Promise<MsgUpsertResponse>;
    Create(request: MsgCreate): Promise<MsgCreateResponse>;
    Update(request: MsgUpdate): Promise<MsgUpdateResponse>;
    Delete(request: MsgDelete): Promise<MsgDeleteResponse>;
}
interface Rpc {
    request(service: string, method: string, data: Uint8Array): Promise<Uint8Array>;
}
declare type Builtin = Date | Function | Uint8Array | string | number | undefined | Long;
export declare type DeepPartial<T> = T extends Builtin ? T : T extends Array<infer U> ? Array<DeepPartial<U>> : T extends ReadonlyArray<infer U> ? ReadonlyArray<DeepPartial<U>> : T extends {} ? {
    [K in keyof T]?: DeepPartial<T[K]>;
} : Partial<T>;
export {};
//# sourceMappingURL=tx.d.ts.map