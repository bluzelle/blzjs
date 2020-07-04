import {BluzelleConfig} from "./BluzelleConfig";
import {GasInfo} from "./GasInfo";
import {AccountResult} from "./types/AccountResult";
import {AccountsResult} from "./types/AccountsResult";
import {QueryResult} from "./types/QueryResult";
import {sendTx} from "./services/CommunicationService";

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
    }


    account = (): Promise<AccountResult> =>
        this.cosmos.getAccounts(this.address)
            .then((x: AccountsResult) => x.result.value);

    count = (): Promise<number> =>
        this.#query<any>(`crud/count/${this.uuid}`)
            .then((res: QueryResult) => parseInt(res.count || '0'));


    txRead(key: string, gasInfo: GasInfo): Promise<string> {
        const msgs = [
            {
                type: "crud/read",
                value: {
                    Key: key,
                    UUID: this.uuid,
                    Owner: this.address
                }
            }
        ];

        return sendTx(this, msgs, 'read', gasInfo)
            .then((res: any) => Buffer.from(res.data, 'hex').toString())
            .then(JSON.parse)
            .then((x: any) => x.value)
    }

    create(key: string, value: string, gasInfo: GasInfo): Promise<void> {
        const msgs = [
            {
                type: "crud/create",
                value: {
                    Key: key,
                    Value: value,
                    UUID: this.uuid,
                    Owner: this.address,
                    Lease: '10000',
                }
            }
        ];

        return sendTx(this, msgs, 'create', gasInfo);
    }

    transferTokensTo(toAddress: string, amount: number, gasInfo: GasInfo): Promise<void> {
        const msgs = [
            {
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
            }
        ];

        return sendTx(this, msgs, 'transfer', gasInfo);
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

