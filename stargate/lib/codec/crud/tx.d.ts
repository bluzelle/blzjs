import Long from "long";
import _m0 from "protobufjs/minimal";
export declare const protobufPackage = "bluzelle.curium.crud";
/** this line is used by starport scaffolding # proto/tx/message */
export interface MsgUpsertCrudValue {
    creator: string;
    uuid: string;
    key: string;
    value: string;
    lease: Long;
}
export interface MsgUpsertCrudValueResponse {
}
export interface MsgCreateCrudValue {
    creator: string;
    uuid: string;
    key: string;
    value: string;
    lease: Long;
}
export interface MsgCreateCrudValueResponse {
}
export interface MsgUpdateCrudValue {
    creator: string;
    uuid: string;
    key: string;
    value: string;
    lease: Long;
}
export interface MsgUpdateCrudValueResponse {
}
export interface MsgDeleteCrudValue {
    creator: string;
    uuid: string;
    key: string;
}
export interface MsgDeleteCrudValueResponse {
}
export declare const MsgUpsertCrudValue: {
    encode(message: MsgUpsertCrudValue, writer?: _m0.Writer): _m0.Writer;
    decode(input: _m0.Reader | Uint8Array, length?: number | undefined): MsgUpsertCrudValue;
    fromJSON(object: any): MsgUpsertCrudValue;
    toJSON(message: MsgUpsertCrudValue): unknown;
    fromPartial(object: DeepPartial<MsgUpsertCrudValue>): MsgUpsertCrudValue;
};
export declare const MsgUpsertCrudValueResponse: {
    encode(_: MsgUpsertCrudValueResponse, writer?: _m0.Writer): _m0.Writer;
    decode(input: _m0.Reader | Uint8Array, length?: number | undefined): MsgUpsertCrudValueResponse;
    fromJSON(_: any): MsgUpsertCrudValueResponse;
    toJSON(_: MsgUpsertCrudValueResponse): unknown;
    fromPartial(_: DeepPartial<MsgUpsertCrudValueResponse>): MsgUpsertCrudValueResponse;
};
export declare const MsgCreateCrudValue: {
    encode(message: MsgCreateCrudValue, writer?: _m0.Writer): _m0.Writer;
    decode(input: _m0.Reader | Uint8Array, length?: number | undefined): MsgCreateCrudValue;
    fromJSON(object: any): MsgCreateCrudValue;
    toJSON(message: MsgCreateCrudValue): unknown;
    fromPartial(object: DeepPartial<MsgCreateCrudValue>): MsgCreateCrudValue;
};
export declare const MsgCreateCrudValueResponse: {
    encode(_: MsgCreateCrudValueResponse, writer?: _m0.Writer): _m0.Writer;
    decode(input: _m0.Reader | Uint8Array, length?: number | undefined): MsgCreateCrudValueResponse;
    fromJSON(_: any): MsgCreateCrudValueResponse;
    toJSON(_: MsgCreateCrudValueResponse): unknown;
    fromPartial(_: DeepPartial<MsgCreateCrudValueResponse>): MsgCreateCrudValueResponse;
};
export declare const MsgUpdateCrudValue: {
    encode(message: MsgUpdateCrudValue, writer?: _m0.Writer): _m0.Writer;
    decode(input: _m0.Reader | Uint8Array, length?: number | undefined): MsgUpdateCrudValue;
    fromJSON(object: any): MsgUpdateCrudValue;
    toJSON(message: MsgUpdateCrudValue): unknown;
    fromPartial(object: DeepPartial<MsgUpdateCrudValue>): MsgUpdateCrudValue;
};
export declare const MsgUpdateCrudValueResponse: {
    encode(_: MsgUpdateCrudValueResponse, writer?: _m0.Writer): _m0.Writer;
    decode(input: _m0.Reader | Uint8Array, length?: number | undefined): MsgUpdateCrudValueResponse;
    fromJSON(_: any): MsgUpdateCrudValueResponse;
    toJSON(_: MsgUpdateCrudValueResponse): unknown;
    fromPartial(_: DeepPartial<MsgUpdateCrudValueResponse>): MsgUpdateCrudValueResponse;
};
export declare const MsgDeleteCrudValue: {
    encode(message: MsgDeleteCrudValue, writer?: _m0.Writer): _m0.Writer;
    decode(input: _m0.Reader | Uint8Array, length?: number | undefined): MsgDeleteCrudValue;
    fromJSON(object: any): MsgDeleteCrudValue;
    toJSON(message: MsgDeleteCrudValue): unknown;
    fromPartial(object: DeepPartial<MsgDeleteCrudValue>): MsgDeleteCrudValue;
};
export declare const MsgDeleteCrudValueResponse: {
    encode(_: MsgDeleteCrudValueResponse, writer?: _m0.Writer): _m0.Writer;
    decode(input: _m0.Reader | Uint8Array, length?: number | undefined): MsgDeleteCrudValueResponse;
    fromJSON(_: any): MsgDeleteCrudValueResponse;
    toJSON(_: MsgDeleteCrudValueResponse): unknown;
    fromPartial(_: DeepPartial<MsgDeleteCrudValueResponse>): MsgDeleteCrudValueResponse;
};
/** Msg defines the Msg service. */
export interface Msg {
    /** this line is used by starport scaffolding # proto/tx/rpc */
    UpsertCrudValue(request: MsgUpsertCrudValue): Promise<MsgUpsertCrudValueResponse>;
    CreateCrudValue(request: MsgCreateCrudValue): Promise<MsgCreateCrudValueResponse>;
    UpdateCrudValue(request: MsgUpdateCrudValue): Promise<MsgUpdateCrudValueResponse>;
    DeleteCrudValue(request: MsgDeleteCrudValue): Promise<MsgDeleteCrudValueResponse>;
}
export declare class MsgClientImpl implements Msg {
    private readonly rpc;
    constructor(rpc: Rpc);
    UpsertCrudValue(request: MsgUpsertCrudValue): Promise<MsgUpsertCrudValueResponse>;
    CreateCrudValue(request: MsgCreateCrudValue): Promise<MsgCreateCrudValueResponse>;
    UpdateCrudValue(request: MsgUpdateCrudValue): Promise<MsgUpdateCrudValueResponse>;
    DeleteCrudValue(request: MsgDeleteCrudValue): Promise<MsgDeleteCrudValueResponse>;
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