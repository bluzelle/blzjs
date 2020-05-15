import { GasInfo } from "../GasInfo";
import { LeaseInfo } from "../LeaseInfo";
import { AccountInfo } from "../AccountInfo";
import { BluzelleConfig } from "../BluzelleConfig";
export declare class API {
    mnemonic: string;
    address: string;
    uuid: string;
    chain_id: string;
    endpoint: string;
    constructor({ mnemonic, endpoint, uuid, chain_id }: BluzelleConfig);
    init(): Promise<void>;
    status(): void;
    create(key: string, value: string, gas_info: GasInfo, lease_info?: LeaseInfo): Promise<void>;
    update(key: string, value: string, gas_info: GasInfo, lease_info?: LeaseInfo): Promise<void>;
    read(key: string, prove?: boolean): Promise<string>;
    txRead(key: string, gas_info: GasInfo): Promise<string>;
    delete(key: string, gas_info: GasInfo): Promise<void>;
    has(key: string): Promise<boolean>;
    txHas(key: string, gas_info: GasInfo): Promise<boolean>;
    keys(): Promise<string[]>;
    txKeys(gas_info: GasInfo): Promise<string[]>;
    rename(key: string, new_key: string, gas_info: GasInfo): Promise<boolean>;
    count(): Promise<number>;
    txCount(gas_info: GasInfo): Promise<number>;
    deleteAll(gas_info: GasInfo): Promise<void>;
    keyValues(): Promise<{
        key: string;
        value: string;
    }[]>;
    txKeyValues(gas_info: GasInfo): Promise<{
        key: string;
        value: string;
    }[]>;
    multiUpdate(keyvalues: {
        key: string;
        value: string;
    }[], gas_info: GasInfo): Promise<void>;
    getLease(key: string): Promise<number>;
    txGetLease(key: string, gas_info: GasInfo): Promise<number>;
    renewLease(key: string, gas_info: GasInfo, lease_info: LeaseInfo): Promise<number>;
    renewLeaseAll(gas_info: GasInfo, lease_info?: LeaseInfo): Promise<number>;
    getNShortestLeases(n: number): Promise<{
        key: string;
        lease: {
            seconds: number;
        };
    }[]>;
    txGetNShortestLeases(n: number, gas_info: GasInfo): Promise<{
        key: string;
        lease: {
            seconds: number;
        };
    }[]>;
    account(): Promise<AccountInfo>;
    version(): Promise<string>;
    private doTx;
}
//# sourceMappingURL=Api.d.ts.map