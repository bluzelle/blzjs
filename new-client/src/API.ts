import {BluzelleConfig} from "./BluzelleConfig";
import {GasInfo} from "./GasInfo";

const cosmosjs = require('@cosmostation/cosmosjs');
const fetch = require('node-fetch');

const TOKEN_NAME = 'ubnt';

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

        return this.#sendTx(msgs, 'read', gasInfo)
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

        return this.#sendTx(msgs, 'create', gasInfo);
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

        return this.#sendTx(msgs, 'transfer', gasInfo);
    }

    #sendTx = (msgs: any[], memo: string, gasInfo: GasInfo): Promise<any> => {
        return this.cosmos.getAccounts(this.address).then((data: any) => {
            const stdSignMsg = this.cosmos.newStdMsg({
                msgs: msgs,
                chain_id: this.chainId,
                fee: getFeeInfo(gasInfo),
                memo: memo,
                account_number: String(data.result.value.account_number),
                sequence: String(data.result.value.sequence)
            });

            const signedTx = this.cosmos.sign(stdSignMsg, this.ecPairPriv, 'block');
            return this.cosmos.broadcast(signedTx);
        })
    }

    #waitForTx = (txHash: string): Promise<void> => {
        return fetch(`${this.url}/txs/${txHash}`)
            .then((response: any) => response.status === 404 ? this.#waitForTx(txHash) : response);
    }
}

const getFeeInfo = ({max_fee, gas_price = 10, max_gas = 200000}: GasInfo) => ({
    amount: [{
        denom: TOKEN_NAME,
        amount: (max_fee ? max_fee : max_gas * gas_price).toString()

    }],
    gas: max_gas.toString()
});
