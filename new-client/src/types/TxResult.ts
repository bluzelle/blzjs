export interface TxResult<T> {
    data: T[]
}

export interface TxCountResult {
    count: string
}

export interface TxHasResult {
    key: string
    has: boolean
}

export interface TxKeysResult {
    keys: string[]
}

export interface TxReadResult {
    value: string
    key: string
}

