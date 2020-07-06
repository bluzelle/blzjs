export interface TxResult<T> {
    data: T[]
}

export interface TxCountResult {
    count: string
}

export interface TxHasResult {
    has: boolean
}

export interface TxReadResult {
    value: string
    key: string
}

