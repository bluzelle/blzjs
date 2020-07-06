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
    TxCountMessage,
    TxCreateMessage,
    TxDeleteAllMessage,
    TxDeleteMessage, TxHasMessage, TxKeysMessage, TxMultiUpdateMessage,
    TxReadMessage, TxRenewLeaseAllMessage,
    TxRenewLeaseMessage
} from "./types/TxMessage";
import {TxCountResult, TxHasResult, TxKeysResult, TxReadResult} from "./types/TxResult";
import {LeaseInfo} from "./types/LeaseInfo";
import {assert} from "../../client/src/Assert";
import {ClientErrors} from "./ClientErrors";

const cosmosjs = require('@cosmostation/cosmosjs');
const fetch = require('node-fetch');

const BLOCK_TIME_IN_SECONDS = 5;

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


    account = (): Promise<AccountResult> =>
        this.cosmos.getAccounts(this.address)
            .then((x: AccountsResult) => x.result.value);

    count = (): Promise<number> =>
        this.#query<QueryCountResult>(`crud/count/${this.uuid}`)
            .then((res: QueryCountResult) => parseInt(res.count || '0'));

    async create(key: string, value: string, gasInfo: GasInfo, leaseInfo: LeaseInfo = {}): Promise<void> {
        const blocks = convertLease(leaseInfo);

        assert(!!key, ClientErrors.KEY_CANNOT_BE_EMPTY);
        assert(typeof key === 'string', ClientErrors.KEY_MUST_BE_A_STRING);
        assert(typeof value === 'string', ClientErrors.VALUE_MUST_BE_A_STRING);
        assert(blocks >= 0, ClientErrors.INVALID_LEASE_TIME);
        assert(!key.includes('/'), ClientErrors.KEY_CANNOT_CONTAIN_SLASH)

        await this.communicationService.sendTx<TxCreateMessage, void>({
            type: "crud/create",
            value: {
                Key: encodeSafe(key),
                Value: encodeSafe(value),
                UUID: this.uuid,
                Owner: this.address,
                Lease: blocks.toString(),
            }
        })
            .then(() => {})
    }


    delete = (key: string): Promise<void> =>
        this.communicationService.sendTx<TxDeleteMessage, void>({
            type: 'crud/delete',
            value: {
                Key: key,
                UUID: this.uuid,
                Owner: this.address
            }
        })
            .then(() => {})

    deleteAll = (gasInfo: GasInfo) =>
        this.communicationService.sendTx<TxDeleteAllMessage, void>({
            type: 'crud/deleteall',
            value: {
                UUID: this.uuid,
                Owner: this.address
            }
        })

    getLease = (key: string) =>
        this.#query<QueryGetLeaseResult>(`crud/getlease/${this.uuid}/${encodeSafe(key)}`)
            .then(res => res.lease * BLOCK_TIME_IN_SECONDS)

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
            .then(res => res.keys);

    keyValues = (): Promise<{key: string, value: string}[]> =>
        this.#query<QueryKeyValuesResult>(`crud/keyvalues/${this.uuid}`)
            .then(res => res.keyvalues)

    multiUpdate = async (keyValues: { key: string, value: string }[], gas_info: GasInfo): Promise<void> => {
        assert(Array.isArray(keyValues), 'keyValues must be an array');

        keyValues.forEach(({key, value}, index, array) => {
            assert(typeof key === 'string', ClientErrors.ALL_KEYS_MUST_BE_STRINGS);
            assert(typeof value === 'string', ClientErrors.ALL_VALUES_MUST_BE_STRINGS);
        });

        return this.communicationService.sendTx<TxMultiUpdateMessage, void>({
            type: 'crud/multiupdate',
            value: {
                KeyValues: keyValues,
                UUID: this.uuid,
                Owner: this.address
            }
        })
            .then(() => {})
    }

    read = (key: string): Promise<string> =>
        this.#query<QueryReadResult>(`crud/read/${this.uuid}/${key}`)
            .then(res => res.value);

    renewLease = async (key: string, gasInfo: GasInfo, leaseInfo: LeaseInfo): Promise<void> => {
        assert(typeof key === 'string', ClientErrors.KEY_MUST_BE_A_STRING);

        const blocks = convertLease(leaseInfo);

        assert(blocks >= 0, ClientErrors.INVALID_LEASE_TIME)

        return this.communicationService.sendTx<TxRenewLeaseMessage, void>({
            type: 'crud/renewlease',
            value: {
                Key: key,
                Lease: blocks.toString(),
                UUID: this.uuid,
                Owner: this.address
            }
        })
            .then(res => {})
    }


    renewLeaseAll = async (gasInfo: GasInfo, leaseInfo: LeaseInfo): Promise<void> => {
        const blocks = convertLease(leaseInfo);
        assert(blocks >= 0, ClientErrors.INVALID_LEASE_TIME);

        return this.communicationService.sendTx<TxRenewLeaseAllMessage, void>({
            type: 'crud/renewleaseall',
            value: {
                Lease: blocks.toString(),
                UUID: this.uuid,
                Owner: this.address
            }
        })
            .then(res => {})

    }

    txCount = async (gas_info: GasInfo): Promise<number> => {
        return this.communicationService.sendTx<TxCountMessage, TxCountResult>({
            type: 'crud/count',
            value: {
                UUID: this.uuid,
                Owner: this.address
            }
        })
            .then(res => res.data.find(it => it.count !== undefined)?.count)
            .then(count => count === undefined ? 0 : parseInt(count))

    }

    txHas = async (key: string, gasInfo: GasInfo): Promise<boolean> => {
        assert(typeof key === 'string', ClientErrors.KEY_MUST_BE_A_STRING);

        return this.communicationService.sendTx<TxHasMessage, TxHasResult>({
            type: 'crud/has',
            value: {
                Key: key,
                UUID: this.uuid,
                Owner: this.address,
            }
        })
            .then(res => res.data.find(it => it.has) ? true: false)

    }

    txKeys = async (gasInfo: GasInfo): Promise<string[]> => {
        return this.communicationService.sendTx<TxKeysMessage, TxKeysResult>({
            type: 'crud/keys',
            value: {
                UUID: this.uuid,
                Owner: this.address
            }
        })
            .then(res => res.data.find(it => it.keys)?.keys || [])
    }


    txRead(key: string, gasInfo: GasInfo): Promise<string | undefined> {
        return this.communicationService.sendTx<TxReadMessage, TxReadResult>({
            type: 'crud/read',
            value: {
                Key: key,
                UUID: this.uuid,
                Owner: this.address
            }
        })
            .then(res => res.data.find(it => it.value && it.key === key)?.value)
    }



    transferTokensTo(toAddress: string, amount: number, gasInfo: GasInfo): Promise<void> {
        return Promise.resolve();
        // const msgs = [
        //     {
        //         type: "cosmos-sdk/MsgSend",
        //         value: {
        //             amount: [
        //                 {
        //                     amount: String(`${amount}000000`),
        //                     denom: "ubnt"
        //                 }
        //             ],
        //             from_address: this.address,
        //             to_address: toAddress
        //         }
        //     }
        // ];
        //
        // return sendTx(this, msgs, 'transfer', gasInfo);
    }

    #query = <T>(path: string): Promise<T> =>
        fetch(`${this.url}/${path}`)
            .then((res: any) => res.json())
            .then((x: any) => x.result)


    #waitForTx = (txHash: string): Promise<void> => {
        return this.#query(`txs/${txHash}`)
            .then((response: any) => response.status === 404 ? this.#waitForTx(txHash) : response);
    }
}

const encodeSafe = (str: string): string =>
    encodeURI(str)
        .replace(/([\#\?])/g, ch => `%${ch.charCodeAt(0).toString(16)}`);


const MINUTE = 60
const HOUR = MINUTE * 60
const DAY = HOUR * 24
const convertLease = ({seconds = 0, minutes = 0, hours = 0, days = 0}: LeaseInfo): number =>
    Math.ceil((seconds + (minutes * MINUTE) + (hours * HOUR) + (days * DAY)) / BLOCK_TIME_IN_SECONDS)

