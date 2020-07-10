import { TxResponse } from "./TxResponse";
import { TxMessage } from "./TxMessage";
import { GasInfo } from "./GasInfo";
export interface Transaction<T> {
    msg: TxMessage<T>;
    gasInfo: GasInfo;
    resolve?: (value: TxResponse<any>) => void;
    reject?: (reason: any) => void;
}
//# sourceMappingURL=Transaction.d.ts.map