import { BluzelleConfig } from "./types/BluzelleConfig";
import { API } from "./API";
export { API } from './API';
export { BluzelleConfig } from './types/BluzelleConfig';
export { SearchOptions } from './API';
export { mnemonicToAddress } from './API';
export { GasInfo } from './types/GasInfo';
export declare type ChunkCallback = (chunk: number, length: number) => unknown;
export interface UploadNftResult {
    hash: string;
    mimeType: string;
}
export declare const bluzelle: (config: BluzelleConfig) => API;
export declare const uploadNft: (url: string, data: Uint8Array, vendor: string, cb?: ChunkCallback | undefined) => Promise<UploadNftResult>;
//# sourceMappingURL=bluzelle-node.d.ts.map