import { Message } from "./Message";
import { MessageResponse } from "./MessageResponse";
import { GasInfo } from "./GasInfo";
export declare class TransactionMessage<T, R> {
    #private;
    gasInfo: GasInfo;
    promise: Promise<MessageResponse<R>>;
    static create<T, R>(msg: Message<T>, gasInfo: GasInfo): TransactionMessage<T, R>;
    private constructor();
    getMessage(): Message<T>;
}
//# sourceMappingURL=TransactionMessage.d.ts.map