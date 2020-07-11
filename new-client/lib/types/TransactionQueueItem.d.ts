import { Message } from "./Message";
import { MessageResponse } from "./MessageResponse";
import { GasInfo } from "./GasInfo";
export interface MessageQueueItem<T> {
    msg: Message<T>;
    resolve?: (value: MessageResponse<any>) => void;
    reject?: (reason: any) => void;
    gasInfo: GasInfo;
}
//# sourceMappingURL=TransactionQueueItem.d.ts.map