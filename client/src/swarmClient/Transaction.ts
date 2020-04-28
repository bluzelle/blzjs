import {MAX_RETRIES} from "./cosmos";
import {Deferred} from "./Deferred";

export class Transaction {
    type: string
    ep: string
    data: any
    deferred: Deferred
    gas_price: number
    max_gas: number
    max_fee: number
    retries_left: number

    constructor(req_type: string, ep_name: string, data: any, def: Deferred) {
        this.type = req_type;
        this.ep = ep_name;
        this.data = data;
        this.deferred = def;
        this.gas_price = 0;
        this.max_gas = 0;
        this.max_fee = 0;
        this.retries_left = MAX_RETRIES;
    }
}