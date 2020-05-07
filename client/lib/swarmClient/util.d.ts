/// <reference types="node" />
import { LeaseInfo } from "../LeaseInfo";
export declare const BLOCK_TIME_IN_SECONDS = 5;
export declare const hash: (hash: string, data: string) => Buffer;
export declare const convertSignature: (sig: any) => Buffer;
export declare const sortJson: (obj: any) => any;
export declare const convertLease: ({ seconds, minutes, hours, days }: LeaseInfo) => number;
export declare const encodeSafe: (str: string) => string;
//# sourceMappingURL=util.d.ts.map