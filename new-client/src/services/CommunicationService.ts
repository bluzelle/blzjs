import {GasInfo} from "../types/GasInfo";
import {Identity} from "monet";
import {TxMessageQueue} from "../types/TxMessageQueue";
import {API} from "../API";
import {TxResponse} from "../types/TxResponse";
import {Transaction} from "../types/Transaction";
import Timeout = NodeJS.Timeout;

const TOKEN_NAME = 'ubnt';


export class CommunicationService {
    #api: API
    #messageQueue: TxMessageQueue = TxMessageQueue.create()
    #waiter?: Timeout


    static create(api: API): CommunicationService {
        return new CommunicationService(api);
    }

    private constructor(api: API) {
        this.#api = api;
    }

    sendTx<T, R>(transaction: Transaction<T>): Promise<TxResponse<R>> {
        const p = new Promise<TxResponse<R>>((resolve, reject) => {
            transaction.resolve = resolve;
            transaction.reject = reject;
        })
        this.#messageQueue.add<T>(transaction)
        this.#waiter || (this.#waiter = setTimeout(this.transmitQueue.bind(this), 100))
        return p;
    }

    transmitQueue(): Promise<void> {
        this.#waiter = undefined;
        const transactions = this.#messageQueue.fetch();
        return this.#api.cosmos.getAccounts(this.#api.address).then((data: any) =>
            Identity.of({
                msgs: transactions.map(tx => tx.msg),
                chain_id: this.#api.chainId,
                fee: getFeeInfo(combineGas(transactions)),
                memo: 'group',
                account_number: String(data.result.value.account_number),
                sequence: String(data.result.value.sequence)
            })
                .map(this.#api.cosmos.newStdMsg.bind(this.#api.cosmos))
                .map((stdSignMsg: any) => this.#api.cosmos.sign(stdSignMsg, this.#api.ecPairPriv, 'block'))
                .map(this.#api.cosmos.broadcast.bind(this.#api.cosmos))
                .map((p: any) => p
                    .then(convertDataFromHexToString)
                    .then(convertDataToObject)
                    .then((x: any) => ({...x, height: parseInt(x.height)}))
                )
                .map((p: any) => p
                    .then(callRequestorsWithData(transactions)),
                )
                .join()
        )
    }
}

const convertDataFromHexToString = (res: any) => ({...res, data: res.data  ? Buffer.from(res.data, 'hex').toString() : undefined})
const convertDataToObject = (res: any) => ({...res, data: res.data !== undefined ? JSON.parse(`[${res.data.split('}{').join('},{')}]`) : undefined})
const callRequestorsWithData = (msgs: any[]) =>
    (res: any) =>
        msgs.reduce((memo: any, msg) => {
            return msg.resolve ? msg.resolve(memo) || memo : memo
        }, res)

const getFeeInfo = ({max_fee, gas_price = 10, max_gas = 200000}: GasInfo) => ({
    amount: [{
        denom: TOKEN_NAME,
        amount: (max_fee ? max_fee : max_gas * gas_price).toString()
    }],
    gas: max_gas.toString()
});

const combineGas = (transactions: Transaction<unknown>[]): GasInfo =>
    transactions.reduce((gasInfo: GasInfo, transaction: Transaction<unknown>) => {
        return {
            max_gas: (gasInfo.max_gas || 0) + (transaction.gasInfo.max_gas || 200000),
            max_fee: (gasInfo.max_fee || 0) + (transaction.gasInfo.max_fee || 0),
            gas_price: Math.max(gasInfo.gas_price || 0,  transaction.gasInfo.gas_price || 0)
        } as GasInfo
    }, {});


