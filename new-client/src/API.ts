import {BluzelleConfig} from "./BluzelleConfig";
import {GasInfo} from "./GasInfo";
import {AccountResult} from "./types/AccountResult";
import {AccountsResult} from "./types/AccountsResult";
import {QueryResult} from "./types/QueryResult";
import {CommunicationService} from "./services/CommunicationService";
import {TxCreateMessage, TxReadMessage} from "./txMessage/TxMessage";
import {TxReadResult} from "./txResult/TxReadResult";

const cosmosjs = require('@cosmostation/cosmosjs');
const fetch = require('node-fetch');


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
        this.#query<any>(`crud/count/${this.uuid}`)
            .then((res: QueryResult) => parseInt(res.count || '0'));


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

    create(key: string, value: string, gasInfo: GasInfo): Promise<void> {
        return this.communicationService.sendTx<TxCreateMessage, void>({
            type: "crud/create",
            value: {
                Key: key,
                Value: value,
                UUID: this.uuid,
                Owner: this.address,
                Lease: '10000',
            }
        })
            .then(x => x)
            .then(() => {
            })
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

    #query = <T>(path: string): Promise<any> =>
        fetch(`${this.url}/${path}`)
            .then((res: any) => res.json())
            .then((x: any) => x.result)


    #waitForTx = (txHash: string): Promise<void> => {
        return this.#query(`txs/${txHash}`)
            .then((response: any) => response.status === 404 ? this.#waitForTx(txHash) : response);
    }
}

