import Long from "long";
import { Nft } from "../nft/nft";
import { PageRequest, PageResponse } from "../cosmos/base/query/v1beta1/pagination";
import _m0 from "protobufjs/minimal";
export declare const protobufPackage = "bluzelle.curium.nft";
/** this line is used by starport scaffolding # 3 */
export interface QueryGetNftRequest {
    id: Long;
}
export interface QueryGetNftResponse {
    Nft?: Nft;
}
export interface QueryAllNftRequest {
    pagination?: PageRequest;
}
export interface QueryAllNftResponse {
    Nft: Nft[];
    pagination?: PageResponse;
}
export declare const QueryGetNftRequest: {
    encode(message: QueryGetNftRequest, writer?: _m0.Writer): _m0.Writer;
    decode(input: _m0.Reader | Uint8Array, length?: number | undefined): QueryGetNftRequest;
    fromJSON(object: any): QueryGetNftRequest;
    toJSON(message: QueryGetNftRequest): unknown;
    fromPartial(object: DeepPartial<QueryGetNftRequest>): QueryGetNftRequest;
};
export declare const QueryGetNftResponse: {
    encode(message: QueryGetNftResponse, writer?: _m0.Writer): _m0.Writer;
    decode(input: _m0.Reader | Uint8Array, length?: number | undefined): QueryGetNftResponse;
    fromJSON(object: any): QueryGetNftResponse;
    toJSON(message: QueryGetNftResponse): unknown;
    fromPartial(object: DeepPartial<QueryGetNftResponse>): QueryGetNftResponse;
};
export declare const QueryAllNftRequest: {
    encode(message: QueryAllNftRequest, writer?: _m0.Writer): _m0.Writer;
    decode(input: _m0.Reader | Uint8Array, length?: number | undefined): QueryAllNftRequest;
    fromJSON(object: any): QueryAllNftRequest;
    toJSON(message: QueryAllNftRequest): unknown;
    fromPartial(object: DeepPartial<QueryAllNftRequest>): QueryAllNftRequest;
};
export declare const QueryAllNftResponse: {
    encode(message: QueryAllNftResponse, writer?: _m0.Writer): _m0.Writer;
    decode(input: _m0.Reader | Uint8Array, length?: number | undefined): QueryAllNftResponse;
    fromJSON(object: any): QueryAllNftResponse;
    toJSON(message: QueryAllNftResponse): unknown;
    fromPartial(object: DeepPartial<QueryAllNftResponse>): QueryAllNftResponse;
};
/** Query defines the gRPC querier service. */
export interface Query {
    /** this line is used by starport scaffolding # 2 */
    Nft(request: QueryGetNftRequest): Promise<QueryGetNftResponse>;
    NftAll(request: QueryAllNftRequest): Promise<QueryAllNftResponse>;
}
export declare class QueryClientImpl implements Query {
    private readonly rpc;
    constructor(rpc: Rpc);
    Nft(request: QueryGetNftRequest): Promise<QueryGetNftResponse>;
    NftAll(request: QueryAllNftRequest): Promise<QueryAllNftResponse>;
}
interface Rpc {
    request(service: string, method: string, data: Uint8Array): Promise<Uint8Array>;
}
declare type Builtin = Date | Function | Uint8Array | string | number | undefined | Long;
export declare type DeepPartial<T> = T extends Builtin ? T : T extends Array<infer U> ? Array<DeepPartial<U>> : T extends ReadonlyArray<infer U> ? ReadonlyArray<DeepPartial<U>> : T extends {} ? {
    [K in keyof T]?: DeepPartial<T[K]>;
} : Partial<T>;
export {};
//# sourceMappingURL=query.d.ts.map