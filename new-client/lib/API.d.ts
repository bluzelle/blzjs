import { BluzelleConfig } from "./types/BluzelleConfig";
import { GasInfo } from "./types/GasInfo";
import { AccountResult } from "./types/cosmos/AccountResult";
import { CommunicationService } from "./services/CommunicationService";
import { LeaseInfo } from "./types/LeaseInfo";
import { TxReadResult } from "./types/TxResult";
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
    account: () => Promise<AccountResult>;
    count: () => Promise<number>;
    create(key: string, value: string, gasInfo: GasInfo, leaseInfo?: LeaseInfo): Promise<void>;
    delete: (key: string, gasInfo: GasInfo) => Promise<void>;
    deleteAll: (gasInfo: GasInfo) => Promise<import("./types/TxResponse").TxResponse<void>>;
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
    }[], gasInfo: GasInfo) => Promise<void>;
    read: (key: string) => Promise<string>;
    renewLease: (key: string, gasInfo: GasInfo, leaseInfo: LeaseInfo) => Promise<void>;
    renewLeaseAll: (gasInfo: GasInfo, leaseInfo: LeaseInfo) => Promise<void>;
    txCount: (gasInfo: GasInfo) => Promise<number>;
    txHas: (key: string, gasInfo: GasInfo) => Promise<boolean>;
    txKeys: (gasInfo: GasInfo) => Promise<string[]>;
    txRead(key: string, gasInfo: GasInfo): Promise<TxReadResult | undefined>;
    update(key: string, value: string, gasInfo: GasInfo, leaseInfo?: LeaseInfo): Promise<void>;
    transferTokensTo(toAddress: string, amount: number, gasInfo: GasInfo): Promise<void>;
}
//# sourceMappingURL=API.d.ts.map