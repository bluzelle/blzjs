import {TxResponse} from "./TxResponse";
import {LeaseInfo} from "./LeaseInfo";

export interface TxMessage<T> {
    type: string
    value: T
    resolve?: (value: TxResponse<any>) => void
    reject?: (reason: any) => void
}

export interface TxCountMessage {
    UUID: string
    Owner: string
}

export interface TxCreateMessage {
    Key: string
    Value: string
    Owner: string
    Lease: string
    UUID: string
}

export interface TxHasMessage {
    Key: string
    Owner: string
    UUID: string
}

export interface TxKeysMessage {
    Owner: string
    UUID: string
}

export interface TxMultiUpdateMessage {
    KeyValues: {key: string, value: string}[]
    Owner: string
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


