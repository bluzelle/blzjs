export interface TxResult<T> {
    data: T[]
}

export interface TxReadResult {
    value: string
    key: string
}

export interface TxCountResult {
    count: string
}