import { GasInfo } from "../types/GasInfo";
import { API } from "../API";
import { MessageResponse } from "../types/MessageResponse";
import { Message } from "../types/Message";
export declare class CommunicationService {
    #private;
    static create(api: API): CommunicationService;
    private constructor();
    sendMessage<T, R>(message: Message<T>, gasInfo: GasInfo): Promise<MessageResponse<R>>;
    checkTransmitQueueNeedsTransmit(): void;
    transmitQueue(): Promise<void>;
}
//# sourceMappingURL=CommunicationService.d.ts.map