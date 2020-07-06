import {TxResult} from "./TxResult";
import {LeaseInfo} from "./LeaseInfo";

export interface TxMessage<T> {
    type: string
    value: T
    resolve?: (value: TxResult<any>) => void
    reject?: (reason: any) => void
}

export interface TxCreateMessage {
    Key: string
    Value: string
    Owner: string
    Lease: string
    UUID: string
}

export interface TxReadMessage {
    Key: string
    Owner: string
    UUID: string
}

export interface TxRenewLeaseMessage {
    Key: string
    Lease: string
    Owner: string
    UUID: string
}

export interface TxRenewLeaseAllMessage {
    Lease: string
    Owner: string
    UUID: string
}

export interface TxDeleteMessage {
    Key: string
    Owner: string
    UUID: string
}

export interface TxDeleteAllMessage {
    Owner: string
    UUID: string
}


