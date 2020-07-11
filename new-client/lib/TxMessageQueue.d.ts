import { MessageQueueItem } from "./types/MessageQueueItem";
export declare class TxMessageQueue {
    #private;
    static create: () => TxMessageQueue;
    private constructor();
    size(): number;
    add<T>(item: MessageQueueItem<T>): void;
    hasMessages(): boolean;
    fetch(): MessageQueueItem<unknown>[];
}
//# sourceMappingURL=TxMessageQueue.d.ts.map