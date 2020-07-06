import {TxMessage} from "./TxMessage";

export class TxMessageQueue {
    #queue: TxMessage<unknown>[] = [];

    static create = () => {
        return new TxMessageQueue();
    }

    private constructor() {}

    add<T>(msg: TxMessage<T>):void {
        this.#queue.push(msg);
    }

    hasMessages():boolean {
        return !!this.#queue.length
    }

    fetch(): TxMessage<unknown>[] {
        const temp = this.#queue;
        this.#queue = [];
        return temp;
    }
}
