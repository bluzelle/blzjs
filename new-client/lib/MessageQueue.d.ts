import { MessageQueueItem } from "./types/MessageQueueItem";
export declare class MessageQueue {
    #private;
    static create: () => MessageQueue;
    private constructor();
    size(): number;
    add<T>(item: MessageQueueItem<T>): void;
    hasMessages(): boolean;
    fetch(): MessageQueueItem<unknown>[];
}
//# sourceMappingURL=MessageQueue.d.ts.map