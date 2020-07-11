import {Message} from "./Message";
import {MessageResponse} from "./MessageResponse";
import {GasInfo} from "./GasInfo";

export class TransactionMessage<T, R> {
    #msg: Message<T>
    #resolve?: (value: MessageResponse<R>) => void
    #reject?: (reason: any) => void
    gasInfo: GasInfo
    promise: Promise<MessageResponse<R>>

    static create<T, R>(msg: Message<T>, gasInfo: GasInfo): TransactionMessage<T, R> {
        return new TransactionMessage<T, R>(msg, gasInfo);
    }

    private constructor(msg: Message<T>, gasInfo: GasInfo) {
        this.#msg = msg;
        this.gasInfo = gasInfo;
        this.promise = new Promise((resolve, reject) => {
            this.#reject = reject;
            this.#resolve = resolve;
        })
    }

    getMessage(): Message<T> {
        return this.#msg;
    }
}
