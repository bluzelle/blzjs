"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Transaction {
    constructor(req_type, ep_name, data, def) {
        this.type = req_type;
        this.ep = ep_name;
        this.data = data;
        this.deferred = def;
        this.gas_price = 0;
        this.max_gas = 0;
        this.max_fee = 0;
    }
}
exports.Transaction = Transaction;
//# sourceMappingURL=Transaction.js.map