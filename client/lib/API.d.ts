import { BluzelleConfig } from "./types/BluzelleConfig";
import { GasInfo } from "./types/GasInfo";
import { AccountResult } from "./types/cosmos/AccountResult";
import { CommunicationService } from "./services/CommunicationService";
import { LeaseInfo } from "./types/LeaseInfo";
import { TxCountResult, TxGetLeaseResult, TxGetNShortestLeasesResult, TxReadResult, TxResult } from "./types/TxResult";
export declare class API {
    #private;
    cosmos: any;
    address: string;
    ecPairPriv: string;
    mnemonic: string;
    chainId: string;
    uuid: string;
    url: string;
    communicationService: CommunicationService;
    constructor(config: BluzelleConfig);
    withTransaction(fn: Function): any;
    setMaxMessagesPerTransaction(count: number): void;
    account: () => Promise<AccountResult>;
    count: () => Promise<number>;
    create(key: string, value: string, gasInfo: GasInfo, leaseInfo?: LeaseInfo): Promise<TxResult>;
    delete: (key: string, gasInfo: GasInfo) => Promise<TxResult>;
    deleteAll: (gasInfo: GasInfo) => Promise<TxResult>;
    getLease: (key: string) => Promise<number>;
    getNShortestLeases: (count: number) => Promise<{
        key: string;
        lease: number;
    }[]>;
    has: (key: string) => Promise<boolean>;
    keys: () => Promise<string[]>;
    keyValues: () => Promise<{
        key: string;
        value: string;
    }[]>;
    multiUpdate: (keyValues: {
        key: string;
        value: string;
    }[], gasInfo: GasInfo) => Promise<TxResult>;
    read: (key: string, prove?: boolean) => Promise<string>;
    renewLease: (key: string, gasInfo: GasInfo, leaseInfo: LeaseInfo) => Promise<TxResult>;
    renewLeaseAll: (gasInfo: GasInfo, leaseInfo?: LeaseInfo) => Promise<TxResult>;
    txCount: (gasInfo: GasInfo) => Promise<TxCountResult>;
    txGetLease: (key: string, gasInfo: GasInfo) => Promise<TxGetLeaseResult>;
    txGetNShortestLeases: (n: number, gasInfo: GasInfo) => Promise<TxGetNShortestLeasesResult>;
    txHas: (key: string, gasInfo: GasInfo) => Promise<boolean>;
    txKeys: (gasInfo: GasInfo) => Promise<string[]>;
    txKeyValues: (gasInfo: GasInfo) => Promise<any>;
    txRead(key: string, gasInfo: GasInfo): Promise<TxReadResult | undefined>;
    update(key: string, value: string, gasInfo: GasInfo, leaseInfo?: LeaseInfo): Promise<void>;
    version(): Promise<string>;
    transferTokensTo(toAddress: string, amount: number, gasInfo: GasInfo): Promise<void>;
}
//# sourceMappingURL=API.d.ts.map