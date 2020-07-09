import {Transaction} from "./Transaction";

export class TxMessageQueue {
    #queue: Transaction<unknown>[] = [];

    static create = () => {
        return new TxMessageQueue();
    }

    private constructor() {}

    add<T>(transaction: Transaction<T>):void {
        this.#queue.push(transaction);
    }

    hasMessages():boolean {
        return !!this.#queue.length
    }

    fetch(): Transaction<unknown>[] {
        const temp = this.#queue;
        this.#queue = [];
        return temp;
    }
}
