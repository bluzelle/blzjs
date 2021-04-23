import { SDKOptions, SDK } from '../rpc';
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
    client?: SDK;
    constructor(config: APIOptions);
    getClient(): Promise<SDK>;
    read(key: string): Promise<string>;
}
//# sourceMappingURL=API.d.ts.map