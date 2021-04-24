import { LeaseInfo } from "./types/LeaseInfo";
import { SDKOptions } from '../client-lib/rpc';
import { BluzelleSdk } from "../bz-sdk/bz-sdk";
export interface SearchOptions {
    page?: number;
    limit?: number;
    reverse?: boolean;
}
export declare const legacyAdapter: (options: APIOptions) => API;
export declare type APIOptions = SDKOptions & {
    uuid: string;
};
export declare class API {
    config: APIOptions;
    client?: BluzelleSdk;
    constructor(config: APIOptions);
    getClient(): Promise<BluzelleSdk>;
    create(key: string, value: string, leaseInfo?: LeaseInfo): Promise<unknown>;
    delete(key: string): Promise<unknown>;
    generateBIP39Account: (entropy?: string) => string;
    read(key: string): Promise<string>;
    update(key: string, value: string, leaseInfo?: LeaseInfo): Promise<unknown>;
    upsert(key: string, value: string, leaseInfo?: LeaseInfo): Promise<unknown>;
}
//# sourceMappingURL=API.d.ts.map