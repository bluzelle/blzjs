import { Deferred } from "./Deferred";
export declare class Transaction {
    type: string;
    ep: string;
    data: any;
    deferred: Deferred;
    gas_price: number;
    max_gas: number;
    max_fee: number;
    retries_left: number;
    constructor(req_type: string, ep_name: string, data: any, def: Deferred);
}
//# sourceMappingURL=Transaction.d.ts.map