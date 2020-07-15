export interface TxResult {
    height: number;
    txhash: string;
}
export interface TxReadResult extends TxResult {
    value: string | undefined;
}
export interface TxCountResult extends TxResult {
    count: number;
}
export interface TxGetLeaseResult extends TxResult {
    lease: number;
}
export interface TxGetNShortestLeasesResult extends TxResult {
    leases: {
        key: string;
        lease: number;
    }[];
}
//# sourceMappingURL=TxResult.d.ts.map