import {GasInfo} from "../types/GasInfo";
import {Identity} from "monet";
import {API} from "../API";
import {MessageResponse} from "../types/MessageResponse";
import Timeout = NodeJS.Timeout;
import {Message} from "../types/Message";
import {TransactionQueue} from "../TransactionQueue";
import {TransactionMessage} from "../types/TransactionMessage";
import {Transaction} from "../Transaction";

const TOKEN_NAME = 'ubnt';




export class CommunicationService {
    #api: API
    #transactionQueue = TransactionQueue.create();
    #waiter?: Timeout
    #maxMessagesPerTransaction = 1;


    static create(api: API): CommunicationService {
        return new CommunicationService(api);
    }

    private constructor(api: API) {
        this.#api = api;
    }

    sendMessage<T, R>(message: Message<T>, gasInfo: GasInfo): Promise<MessageResponse<R>> {
        const msg = TransactionMessage.create<T, R>(message, gasInfo);
        this.#transactionQueue.tail || this.#transactionQueue.append(Transaction.create());
        this.#transactionQueue.tail?.addMessage(msg);

        this.checkTransmitQueueNeedsTransmit();
        return msg.promise;
    }

    checkTransmitQueueNeedsTransmit(): void {
        if(this.#transactionQueue.head && this.#transactionQueue.head.messageCount() >= this.#maxMessagesPerTransaction) {
            this.#waiter && clearTimeout(this.#waiter);
            this.#waiter = undefined;
            this.transmitQueue();
        } else {
            this.#waiter || (this.#waiter = setTimeout(() => this.#transactionQueue.head && this.transmitQueue.bind(this), 100))
        }

    }

    transmitQueue(): Promise<void> {
        this.#waiter = undefined;
        const transaction = this.#transactionQueue.head?.detach();
        return this.#api.cosmos.getAccounts(this.#api.address).then((data: any) =>
            Identity.of({
                msgs: transaction?.getMessages().map(x => x.getMessage()),
                chain_id: this.#api.chainId,
                fee: getFeeInfo(combineGas(transaction?.getMessages() || [])),
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
//                    .then(callRequestorsWithData(transaction)),
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

const combineGas = (transactions: TransactionMessage<any, any>[]): GasInfo =>
    transactions.reduce((gasInfo: GasInfo, transaction: TransactionMessage<any, any>) => {
        return {
            max_gas: (gasInfo.max_gas || 0) + (transaction.gasInfo.max_gas || 200000),
            max_fee: (gasInfo.max_fee || 0) + (transaction.gasInfo.max_fee || 0),
            gas_price: Math.max(gasInfo.gas_price || 0,  transaction.gasInfo.gas_price || 0)
        } as GasInfo
    }, {});


