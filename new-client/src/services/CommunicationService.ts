import {GasInfo} from "../types/GasInfo";
import {Identity, Maybe, None, Some} from "monet";
import {API} from "../API";
import {MessageResponse} from "../types/MessageResponse";
import Timeout = NodeJS.Timeout;
import {Message} from "../types/Message";
import {takeWhile, without} from 'lodash'

const TOKEN_NAME = 'ubnt';

interface MessageQueueItem<T, R> {
    message: Message<T>
    resolve?: (value: MessageResponse<R>) => void
    reject?: (reason: any) => void
    gasInfo: GasInfo
    transactionId: number
}

const counter = (() => {
    let start = 1;
    return () => start++;
})()

export class CommunicationService {
    #api: API
    #messageQueue:  MessageQueueItem<any, any>[] = [];
    #maxMessagesPerTransaction = 1;
    #checkTransmitQueueTail: Promise<any> = Promise.resolve();
    #currentTransactionId: number = 0;


    static create(api: API): CommunicationService {
        return new CommunicationService(api);
    }

    private constructor(api: API) {
        this.#api = api;
    }

    sendMessage<T, R>(message: Message<T>, gasInfo: GasInfo): Promise<MessageResponse<R>> {
        const p = new Promise<MessageResponse<R>>((resolve, reject) => {
            this.#messageQueue.push({
                message: message,
                gasInfo: gasInfo,
                resolve: resolve,
                reject: reject,
                transactionId: this.#currentTransactionId
            })
        })
        this.#messageQueue.length === 1 && (this.#checkTransmitQueueTail = this.#checkTransmitQueueTail.then(this.transmitQueueNeedsTransmit.bind(this)));
        return p;
    }

    transmitQueueNeedsTransmit() {
        Some(this.#messageQueue)
            .flatMap(queue => queue.length ? Some<any>(this.#messageQueue) : None())
            .map(queue => [queue[0].transactionId, queue])
            .map(([transactionId, queue]) => [
                takeWhile(queue, (it: MessageQueueItem<any, any>) => it.transactionId === transactionId),
                queue
            ])
            .map(([messages, queue]) => {
                this.#messageQueue = without(queue, messages);
                return messages
            })
            .map(this.transmitQueue.bind(this))
    }


    transmitQueue(messages: MessageQueueItem<any, any>[]): Promise<void> {
        return this.#api.cosmos.getAccounts(this.#api.address).then((data: any) =>
            Some({
                msgs: messages.map(m => m.message),
                chain_id: this.#api.chainId,
                fee: getFeeInfo(combineGas(messages)),
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
                    .then(callRequestorsWithData(messages)),
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

const combineGas = (transactions: MessageQueueItem<any, any>[]): GasInfo =>
    transactions.reduce((gasInfo: GasInfo, transaction: MessageQueueItem<any, any>) => {
        return {
            max_gas: (gasInfo.max_gas || 0) + (transaction.gasInfo.max_gas || 200000),
            max_fee: (gasInfo.max_fee || 0) + (transaction.gasInfo.max_fee || 0),
            gas_price: Math.max(gasInfo.gas_price || 0,  transaction.gasInfo.gas_price || 0)
        } as GasInfo
    }, {});


