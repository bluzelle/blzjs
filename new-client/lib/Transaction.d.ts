import { TransactionMessage } from "./types/TransactionMessage";
import LinkedList from 'linked-list';
export declare class Transaction extends LinkedList.Item {
    #private;
    static create(): void;
    private constructor();
    addMessage(message: TransactionMessage<any, any>): void;
    messageCount(): number;
    getMessages(): TransactionMessage<unknown, unknown>[];
}
//# sourceMappingURL=Transaction.d.ts.map