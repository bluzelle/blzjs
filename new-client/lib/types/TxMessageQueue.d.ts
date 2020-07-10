import { Transaction } from "./Transaction";
export declare class TxMessageQueue {
    #private;
    static create: () => TxMessageQueue;
    private constructor();
    add<T>(transaction: Transaction<T>): void;
    hasMessages(): boolean;
    fetch(): Transaction<unknown>[];
}
//# sourceMappingURL=TxMessageQueue.d.ts.map