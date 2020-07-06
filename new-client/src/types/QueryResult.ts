export interface QueryCountResult {
    count: string
}

export interface QueryKeysResult {
    keys: string[]
}

export interface QueryHasResult {
    has: boolean
}

export interface QueryReadResult {
    value: string
}

export interface QueryKeyValuesResult {
    keyvalues: {key: string, value: string}[]
}

export interface QueryGetLeaseResult {
    lease: number
}