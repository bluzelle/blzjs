export interface TxResult {
    height: number
    txhash: string
}

export interface TxReadResult extends TxResult {
    value: string | undefined
}

export interface TxCountResult extends TxResult {
    count: number
}