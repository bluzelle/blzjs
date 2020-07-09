import {GasInfo} from "../types/GasInfo";
import {Identity} from "monet";
import {TxMessage} from "../types/TxMessage";
import {TxMessageQueue} from "../types/TxMessageQueue";
import {API} from "../API";
import {TxResponse} from "../types/TxResponse";
import delay from "delay";

const TOKEN_NAME = 'ubnt';


export class CommunicationService {
    #api: API
    #messageQueue: TxMessageQueue = TxMessageQueue.create()


    static create(api: API): CommunicationService {
        return new CommunicationService(api);
    }

    private constructor(api: API) {
        this.#api = api;
        setTimeout(this.checkTransmitQueue.bind(this));
    }

    sendTx<T, R>(msg: TxMessage<T>): Promise<TxResponse<R>> {
        const p = new Promise<TxResponse<R>>((resolve, reject) => {
            msg.resolve = resolve;
            msg.reject = reject;
        })
        this.#messageQueue.add<T>(msg as TxMessage<T>)
        return p;
    }

    checkTransmitQueue(): void {
        this.#messageQueue.hasMessages() ? (
            this.transmitQueue(this.#messageQueue.fetch()).then(this.checkTransmitQueue.bind(this))
        ) : (
            delay(100).then(this.checkTransmitQueue.bind(this))
        )
    }

    transmitQueue(msgs: TxMessage<unknown>[]): Promise<void> {
        return this.#api.cosmos.getAccounts(this.#api.address).then((data: any) =>
            Identity.of({
                msgs,
                chain_id: this.#api.chainId,
                fee: getFeeInfo({}),
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
                    .then(callRequestorsWithData(msgs)),
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
            memo.time = Date.now() - msg.startTime
            return msg.resolve ? msg.resolve(memo) || memo : memo
        }, res)

const getFeeInfo = ({max_fee, gas_price = 10, max_gas = 200000}: GasInfo) => ({
    amount: [{
        denom: TOKEN_NAME,
        amount: (max_fee ? max_fee : max_gas * gas_price).toString()

    }],
    gas: max_gas.toString()
});


