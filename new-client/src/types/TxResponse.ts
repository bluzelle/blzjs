interface TxResponse {
    height: number
    txhash: string
    log: any[]
}

export interface StdTxResponse extends TxResponse {}