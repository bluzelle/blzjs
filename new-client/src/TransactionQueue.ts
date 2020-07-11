import LinkedList from 'linked-list'
import {Transaction} from "./Transaction";

export class TransactionQueue extends LinkedList<Transaction> {
    static create() {
        return new TransactionQueue();
    }
}
