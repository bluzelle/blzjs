import {BluzelleConfig} from "./BluzelleConfig";
import {GasInfo} from "./GasInfo";
const cosmosjs = require('@cosmostation/cosmosjs');

export class API {
    cosmos: any;
    address: string;
    ecPairPriv: string;
    mnemonic: string;
    chainId: string;
    uuid: string

    constructor(config: BluzelleConfig) {
        this.cosmos = cosmosjs.network(config.endpoint, config.chain_id);
        this.cosmos.setPath("m/44'/118'/0'/0/0");
        this.mnemonic = config.mnemonic;
        this.address = this.cosmos.getAddress(this.mnemonic);
        this.ecPairPriv = this.cosmos.getECPairPriv(this.mnemonic);
        this.chainId = config.chain_id;
        this.uuid = config.uuid;
    }

    transferTokensTo(toAddress: string, amount: number, gasInfo: GasInfo) {
        this.cosmos.getAccounts(toAddress).then((data: any) => {
            let stdSignMsg = this.cosmos.newStdMsg({
                msgs: [
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
                ],
                chain_id: this.chainId,
                fee: { amount: [ { amount: String(5000), denom: "ubnt" } ], gas: `${gasInfo.gas_price}000000`},
                memo: `transfer bnt`,
                account_number: String(data.result.value.account_number),
                sequence: String(data.result.value.sequence)
            });

            const signedTx = this.cosmos.sign(stdSignMsg, this.ecPairPriv);
            this.cosmos.broadcast(signedTx).then((response: any) => console.log(response));
        })
    }
}