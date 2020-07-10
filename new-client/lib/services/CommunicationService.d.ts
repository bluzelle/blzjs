import { API } from "../API";
import { TxResponse } from "../types/TxResponse";
import { Transaction } from "../types/Transaction";
export declare class CommunicationService {
    #private;
    static create(api: API): CommunicationService;
    private constructor();
    sendTx<T, R>(transaction: Transaction<T>): Promise<TxResponse<R>>;
    transmitQueue(): Promise<void>;
}
//# sourceMappingURL=CommunicationService.d.ts.map