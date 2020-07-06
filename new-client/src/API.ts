import {BluzelleConfig} from "./types/BluzelleConfig";
import {GasInfo} from "./types/GasInfo";
import {AccountResult} from "./types/cosmos/AccountResult";
import {AccountsResult} from "./types/cosmos/AccountsResult";
import {
    QueryCountResult, QueryGetLeaseResult,
    QueryHasResult,
    QueryKeysResult,
    QueryKeyValuesResult,
    QueryReadResult
} from "./types/QueryResult";
import {CommunicationService} from "./services/CommunicationService";
import {TxCreateMessage, TxDeleteAllMessage, TxDeleteMessage, TxReadMessage} from "./types/TxMessage";
import {TxReadResult} from "./types/TxResult";
import {LeaseInfo} from "./types/LeaseInfo";

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

    create(key: string, value: string, gasInfo: GasInfo, leaseInfo: LeaseInfo): Promise<void> {
        return this.communicationService.sendTx<TxCreateMessage, void>({
            type: "crud/create",
            value: {
                Key: encodeSafe(key),
                Value: value,
                UUID: this.uuid,
                Owner: this.address,
                Lease: convertLease(leaseInfo).toString(),
            }
        })
            .then(x => x)
            .then(() => {
            })
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


    has = (key: string): Promise<boolean> =>
        this.#query<QueryHasResult>(`crud/has/${this.uuid}/${key}`)
            .then(res => res.has);

    keys = (): Promise<string[]> =>
        this.#query<QueryKeysResult>(`crud/keys/${this.uuid}`)
            .then(res => res.keys);

    keyValues = (): Promise<{key: string, value: string}[]> =>
        this.#query<QueryKeyValuesResult>(`crud/keyvalues/${this.uuid}`)
            .then(res => res.keyvalues)

    read = (key: string): Promise<string> =>
        this.#query<QueryReadResult>(`crud/read/${this.uuid}/${key}`)
            .then(res => res.value);



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
    (seconds + (minutes * MINUTE) + (hours * HOUR) + (days * DAY)) / BLOCK_TIME_IN_SECONDS

