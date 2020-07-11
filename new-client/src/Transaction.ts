import {TransactionMessage} from "./types/TransactionMessage";
import LinkedList from 'linked-list'

export class Transaction extends LinkedList.Item{

    #messages: TransactionMessage<unknown, unknown>[] = [];

    static create() {}

    private constructor() {
        super();
    }

    addMessage(message: TransactionMessage<any, any>) {
        this.#messages.push(message);
    }

    messageCount(): number {
        return this.#messages.length;
    }

    getMessages(): TransactionMessage<unknown, unknown>[] {
        return this.#messages;
    }
}