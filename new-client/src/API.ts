import {BluzelleConfig} from "./types/BluzelleConfig";
import {GasInfo} from "./types/GasInfo";
import {AccountResult} from "./types/cosmos/AccountResult";
import {AccountsResult} from "./types/cosmos/AccountsResult";
import {
    QueryCountResult, QueryGetLeaseResult, QueryGetNShortestLeasesResult,
    QueryHasResult,
    QueryKeysResult,
    QueryKeyValuesResult,
    QueryReadResult
} from "./types/QueryResult";
import {CommunicationService} from "./services/CommunicationService";
import {
    CountMessage,
    CreateMessage,
    DeleteAllMessage,
    DeleteMessage, GetLeaseMessage, HasMessage, KeysMessage, KeyValuesMessage, MultiUpdateMessage,
    ReadMessage, RenewLeaseAllMessage,
    RenewLeaseMessage, TransferTokensMessage, UpdateMessage
} from "./types/Message";
import {
    TxCountResponse,
    TxGetLeaseResponse,
    TxHasResponse,
    TxKeysResponse, TxKeyValuesResponse,
    TxReadResponse
} from "./types/MessageResponse";
import {LeaseInfo} from "./types/LeaseInfo";
import {ClientErrors} from "./ClientErrors";
import {pullAt} from 'lodash'
import {TxCountResult, TxGetLeaseResult, TxGetNShortestLeasesResult, TxReadResult, TxResult} from "./types/TxResult";
import {assert} from "./Assert";
import {Some} from "monet";

const cosmosjs = require('@cosmostation/cosmosjs');
const fetch = require('node-fetch');

const BLOCK_TIME_IN_SECONDS = 5;

interface QueryError {
    status: number
    error: string
}

export class API {
    cosmos: any;
    address: string;
    ecPairPriv: string;
    mnemonic: string;
    chainId: string;
    uuid: string;
    url: string;
    communicationService: CommunicationService


    constructor(config: BluzelleConfig) {
        this.cosmos = cosmosjs.network(config.endpoint, config.chain_id);
        this.cosmos.setPath("m/44'/118'/0'/0/0");
        this.cosmos.bech32MainPrefix = "bluzelle"
        this.mnemonic = config.mnemonic;
        this.address = this.cosmos.getAddress(this.mnemonic);
        this.ecPairPriv = this.cosmos.getECPairPriv(this.mnemonic);
        this.chainId = config.chain_id;
        this.uuid = config.uuid;
        this.url = config.endpoint;
        this.communicationService = CommunicationService.create(this);
    }


    withTransaction(fn: Function) {
        return this.communicationService.withTransaction(fn);
    }

    setMaxMessagesPerTransaction(count: number) {
        this.communicationService.setMaxMessagesPerTransaction(count);
    }

    account = (): Promise<AccountResult> =>
        this.cosmos.getAccounts(this.address)
            .then((x: AccountsResult) => x.result.value);

    count = (): Promise<number> =>
        this.#query<QueryCountResult>(`crud/count/${this.uuid}`)
            .then((res: QueryCountResult) => parseInt(res.count || '0'));

    async create(key: string, value: string, gasInfo: GasInfo, leaseInfo: LeaseInfo = {}): Promise<TxResult> {
        const blocks = convertLease(leaseInfo);

        assert(!!key, ClientErrors.KEY_CANNOT_BE_EMPTY);
        assert(typeof key === 'string', ClientErrors.KEY_MUST_BE_A_STRING);
        assert(typeof value === 'string', ClientErrors.VALUE_MUST_BE_A_STRING);
        assert(blocks >= 0, ClientErrors.INVALID_LEASE_TIME);
        assert(!key.includes('/'), ClientErrors.KEY_CANNOT_CONTAIN_SLASH)

        return this.communicationService.sendMessage<CreateMessage, void>({
            type: "crud/create",
            value: {
                Key: encodeSafe(key),
                Value: encodeSafe(value),
                UUID: this.uuid,
                Owner: this.address,
                Lease: blocks.toString(),
            }
        }, gasInfo)
            .then(res => ({height: res.height, txhash: res.txhash}))
    }


    delete = (key: string, gasInfo: GasInfo): Promise<TxResult> =>
        this.communicationService.sendMessage<DeleteMessage, void>({
            type: 'crud/delete',
            value: {
                Key: key,
                UUID: this.uuid,
                Owner: this.address
            }
        }, gasInfo)
            .then(res => ({height: res.height, txhash: res.txhash}))

    deleteAll = (gasInfo: GasInfo): Promise<TxResult> =>
        this.communicationService.sendMessage<DeleteAllMessage, void>({
            type: 'crud/deleteall',
            value: {
                UUID: this.uuid,
                Owner: this.address
            }
        }, gasInfo)
            .then(res => ({height: res.height, txhash: res.txhash}))

    getLease = (key: string) =>
        this.#query<QueryGetLeaseResult & { error: string }>(`crud/getlease/${this.uuid}/${encodeSafe(key)}`)
            .then(res => res.lease * BLOCK_TIME_IN_SECONDS)
            .catch(res => {
                throw res.error === 'Not Found' ? `key "${key}" not found` : res.error
            })

    getNShortestLeases = async (count: number) => {
        assert(count >= 0, ClientErrors.INVALID_VALUE_SPECIFIED);
        return this.#query<QueryGetNShortestLeasesResult>(`crud/getnshortestleases/${this.uuid}/${count}`)
            .then(res => res.keyleases.map(({key, lease}) => ({key, lease: parseInt(lease) * BLOCK_TIME_IN_SECONDS})));
    }


    has = (key: string): Promise<boolean> =>
        this.#query<QueryHasResult>(`crud/has/${this.uuid}/${key}`)
            .then(res => res.has);

    keys = (): Promise<string[]> =>
        this.#query<QueryKeysResult>(`crud/keys/${this.uuid}`)
            .then(res => res.keys)
            .then(keys => keys.map(decodeSafe));

    keyValues = (): Promise<{ key: string, value: string }[]> =>
        this.#query<QueryKeyValuesResult>(`crud/keyvalues/${this.uuid}`)
            .then(res => res.keyvalues)

    multiUpdate = async (keyValues: { key: string, value: string }[], gasInfo: GasInfo): Promise<TxResult> => {
        assert(Array.isArray(keyValues), 'keyValues must be an array');

        keyValues.forEach(({key, value}, index, array) => {
            assert(typeof key === 'string', ClientErrors.ALL_KEYS_MUST_BE_STRINGS);
            assert(typeof value === 'string', ClientErrors.ALL_VALUES_MUST_BE_STRINGS);
        });

        return this.communicationService.sendMessage<MultiUpdateMessage, void>({
            type: 'crud/multiupdate',
            value: {
                KeyValues: keyValues,
                UUID: this.uuid,
                Owner: this.address
            }
        }, gasInfo)
            .then(res => ({txhash: res.txhash, height: res.height}))
    }

    read = (key: string, prove: boolean = false): Promise<string> =>
        this.#query<QueryReadResult>(`crud/${prove ? 'pread' : 'read'}/${this.uuid}/${encodeSafe(key)}`)
            .then(res => res.value)
                        .then(decodeSafe)
            .catch(({error}) => {
                throw(new Error(error === 'Not Found' ? `key "${key}" not found` : error))
            });


    renewLease = async (key: string, gasInfo: GasInfo, leaseInfo: LeaseInfo): Promise<TxResult> => {
        assert(typeof key === 'string', ClientErrors.KEY_MUST_BE_A_STRING);

        const blocks = convertLease(leaseInfo);

        assert(blocks >= 0, ClientErrors.INVALID_LEASE_TIME)

        return this.communicationService.sendMessage<RenewLeaseMessage, void>({
            type: 'crud/renewlease',
            value: {
                Key: key,
                Lease: blocks.toString(),
                UUID: this.uuid,
                Owner: this.address
            }
        }, gasInfo)
            .then(res => ({height: res.height, txhash: res.txhash}))
    }


    renewLeaseAll = async (gasInfo: GasInfo, leaseInfo: LeaseInfo = {}): Promise<TxResult> => {
        const blocks = convertLease(leaseInfo);
        assert(blocks >= 0, ClientErrors.INVALID_LEASE_TIME);

        return this.communicationService.sendMessage<RenewLeaseAllMessage, void>({
            type: 'crud/renewleaseall',
            value: {
                Lease: blocks.toString(),
                UUID: this.uuid,
                Owner: this.address
            }
        }, gasInfo)
            .then(res => ({height: res.height, txhash: res.txhash}))

    }

    txCount = async (gasInfo: GasInfo): Promise<TxCountResult> => {
        return this.communicationService.sendMessage<CountMessage, TxCountResponse>({
            type: 'crud/count',
            value: {
                UUID: this.uuid,
                Owner: this.address
            }
        }, gasInfo)
            .then(res => findMine<TxCountResponse>(res, it => it.count !== undefined))
            .then(({res, data}) => ({height: res.height, txhash: res.txhash, count: parseInt(data?.count || '0')}))

    }

    txGetLease = async (key: string, gasInfo: GasInfo): Promise<TxGetLeaseResult> => {
        return this.communicationService.sendMessage<GetLeaseMessage, TxGetLeaseResponse>({
            type: 'crud/getlease',
            value: {
                Key: key,
                UUID: this.uuid,
                Owner: this.address
            }
        }, gasInfo)
            .then(res => findMine<TxGetLeaseResponse>(res, it => it.key === key && it.lease !== undefined))
            .then(({res, data}) => ({
                height: res.height,
                txhash: res.txhash,
                lease: parseInt(data?.lease || '0') * BLOCK_TIME_IN_SECONDS
            }))
    }

    txGetNShortestLeases = async (n: number, gasInfo: GasInfo): Promise<TxGetNShortestLeasesResult> => {
        return {
            txhash: 'xxx',
            height: 1,
            leases: []
        }
    }

    txHas = async (key: string, gasInfo: GasInfo): Promise<boolean> => {
        assert(typeof key === 'string', ClientErrors.KEY_MUST_BE_A_STRING);

        return this.communicationService.sendMessage<HasMessage, TxHasResponse>({
            type: 'crud/has',
            value: {
                Key: key,
                UUID: this.uuid,
                Owner: this.address,
            }
        }, gasInfo)
            .then(res => res.data.find(it => it.key === key && it.has) ? true : false)

    }

    txKeys = async (gasInfo: GasInfo): Promise<string[]> => {
        return this.communicationService.sendMessage<KeysMessage, TxKeysResponse>({
            type: 'crud/keys',
            value: {
                UUID: this.uuid,
                Owner: this.address
            }
        }, gasInfo)
            .then(res => res.data.find(it => it.keys)?.keys || [])
    }

    txKeyValues = async (gasInfo: GasInfo): Promise<any> => {
        return this.communicationService.sendMessage<KeyValuesMessage, TxKeyValuesResponse>({
            type: 'crud/keyvalues',
            value: {
                Owner: this.address,
                UUID: this.uuid
            }
        }, gasInfo)
            .then(res => findMine<TxKeyValuesResponse>(res, it => {
                return Array.isArray(it.keyvalues) &&
                    !!(it.keyvalues.length === 0 || (it.keyvalues[0].key && it.keyvalues[0].value))
            }))
            .then(({res, data}) => ({height: res.height, txhash: res.txhash, keyvalues: data?.keyvalues}))
    }


    txRead(key: string, gasInfo: GasInfo): Promise<TxReadResult | undefined> {
        return this.communicationService.sendMessage<ReadMessage, TxReadResponse>({
            type: 'crud/read',
            value: {
                Key: key,
                UUID: this.uuid,
                Owner: this.address
            }
        }, gasInfo)
            .then(res => findMine<TxReadResponse>(res, it => it.value !== undefined && it.key === key))
            .then(({res, data}) => ({height: res.height, txhash: res.txhash, value: data?.value}))
    }

    async update(key: string, value: string, gasInfo: GasInfo, leaseInfo: LeaseInfo = {}): Promise<void> {

        const blocks = convertLease(leaseInfo);

        assert(!!key, ClientErrors.KEY_CANNOT_BE_EMPTY);
        assert(typeof key === 'string', ClientErrors.KEY_MUST_BE_A_STRING);
        assert(typeof value === 'string', ClientErrors.VALUE_MUST_BE_A_STRING);
        assert(blocks >= 0, ClientErrors.INVALID_LEASE_TIME);
        assert(!key.includes('/'), ClientErrors.KEY_CANNOT_CONTAIN_SLASH)

        await this.communicationService.sendMessage<UpdateMessage, void>({
            type: "crud/update",
            value: {
                Key: encodeSafe(key),
                Value: encodeSafe(value),
                UUID: this.uuid,
                Owner: this.address,
                Lease: blocks.toString()
            }
        }, gasInfo)
            .then(res => ({height: res.height, txhash: res.txhash}))
    }

    version(): Promise<string> {
        return this.#query<any>('node_info').then(res => res.application_version.version);
    }

    transferTokensTo(toAddress: string, amount: number, gasInfo: GasInfo): Promise<void> {
        return this.communicationService.sendMessage<TransferTokensMessage, void>({
            type: "cosmos-sdk/MsgSend",
            value: {
                amount: [
                    {
                        amount: String(`${amount}000000`),
                        denom: "ubnt"
                    }
                ],
                from_address: this.address,
                to_address: toAddress
            }
        }, gasInfo)
            .then(() => {
            })
    }

    #query = <T>(path: string): Promise<T> =>
        fetch(`${this.url}/${path}`)
            .then((res: any) => {
                if (res.status !== 200) {
                    throw {
                        status: res.status,
                        error: res.statusText
                    } as QueryError
                }
                return res.json().then((obj: any) => obj.result ?? obj)
            })
}


const decodeSafe = (str: string): string =>
    decodeURI(str)
        .replace(/%../g, x => Some(x)
            .map(x => x.replace('%', ''))
            .map(x => parseInt(x, 16))
            .map(String.fromCharCode)
            .join()
        )


const encodeSafe = (str: string): string => Some(str)
    .map(str => str.replace(/([%])/g, ch => `%${ch.charCodeAt(0).toString(16)}`))
    .map(encodeURI)
    .map(str => str.replace(/([\#\?\&])/g, ch => `%${ch.charCodeAt(0).toString(16)}`))
    .join();


const MINUTE = 60
const HOUR = MINUTE * 60
const DAY = HOUR * 24
const convertLease = ({seconds = 0, minutes = 0, hours = 0, days = 0}: LeaseInfo): number =>
    Math.ceil((seconds + (minutes * MINUTE) + (hours * HOUR) + (days * DAY)) / BLOCK_TIME_IN_SECONDS)

const findMine = <T>(res: { data: T[] }, condition: (x: T) => boolean): { res: any, data: T | undefined } => {
    for (let i: number = 0; i < res.data.length; i++) {
        if (condition(res.data[i])) {
            const found = res.data[i];
            pullAt(res.data, i)
            return {res, data: found}
        }
    }
    return {res, data: undefined}
}