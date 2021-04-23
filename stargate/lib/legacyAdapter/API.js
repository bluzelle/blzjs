"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.API = exports.legacyAdapter = void 0;
const tendermint_rpc_1 = require("@cosmjs/tendermint-rpc");
const lodash_1 = require("lodash");
const query_1 = require("../codec/crud/query");
const stargate_1 = require("@cosmjs/stargate");
const rpc_1 = require("../rpc");
// TEMP STUB
const BLOCK_TIME_IN_SECONDS = 5.5;
const legacyAdapter = (options) => new API(options);
exports.legacyAdapter = legacyAdapter;
class API {
    constructor(config) {
        this.config = config;
    }
    getClient() {
        return this.client ? Promise.resolve(this.client) : rpc_1.sdk(this.config);
    }
    // withTransaction<T>(fn: () => any, {memo}: WithTransactionsOptions = {memo: ''}): Promise<MessageResponse<T>> {
    //     return withTransaction<T>(this.communicationService, fn, {memo});
    // }
    //
    // setMaxMessagesPerTransaction(count: number) {
    //     // This is here for backward compatibility - delete later
    // }
    //
    // account(address: string = this.address): Promise<AccountResult> {
    //     return getCosmos(this)
    //         .then(cosmos => cosmos.getAccounts(address))
    //         .then((x: AccountsResult) => x.result.value);
    // }
    //
    // isExistingAccount(): Promise<boolean> {
    //     return this.account()
    //         .then(x => !!x.coins.length)
    // }
    //
    // count(): Promise<number> {
    //     return this.#abciQuery<QueryCountResult>(`/custom/crud/count/${this.uuid}`)
    //         .then(x => x.result)
    //         .then((res: QueryCountResult) => parseInt(res.count || '0'));
    // }
    //
    //
    // async create(key: string, value: string, gasInfo: GasInfo, leaseInfo: LeaseInfo = {}): Promise<TxResult> {
    //     const blocks = convertLease(leaseInfo);
    //
    //     //assert(typeof key === 'string', ClientErrors.KEY_MUST_BE_A_STRING);
    //     //assert(typeof value === 'string', ClientErrors.VALUE_MUST_BE_A_STRING);
    //
    //     return mnemonicToAddress(this.mnemonic)
    //         .then(address => sendMessage<MsgCreate, void>(this.communicationService, {
    //             typeUrl: "/bluzelle.curium.crud.MsgCreate",
    //             value: {
    //                 key: key,
    //                 value: new TextEncoder().encode(value),
    //                 uuid: this.uuid,
    //                 creator: address,
    //                 lease: Long.fromInt(blocks),
    //                 metadata: new Uint8Array()
    //             }
    //         }, gasInfo))
    //         .then(x => x)
    //         .then(standardTxResult)
    // }
    //
    // createProposal(amount: number, title: string, description: string, gasInfo: GasInfo) {
    //     return this.sendMessage({
    //             "type": "cosmos-sdk/MsgSubmitProposal",
    //             "value": {
    //                 "content": {
    //                     "type": "cosmos-sdk/TextProposal",
    //                     "value": {
    //                         "title": title,
    //                         "description": description
    //                     }
    //                 },
    //                 "initial_deposit": [
    //                     {
    //                         "denom": "ubnt",
    //                         "amount": `${amount}000000`
    //                     }
    //                 ],
    //                 "proposer": this.address
    //             }
    //         }, gasInfo
    //     )
    //         .then((x: any) => ({id: x.logs[0].events[2].attributes[0].value}))
    // }
    //
    // depositToProposal(id: string, amount: number, title: string, description: string, gasInfo: GasInfo) {
    //     return this.sendMessage({
    //             "type": "cosmos-sdk/MsgDeposit",
    //             "value": {
    //                 "proposal_id": id,
    //                 "depositor": this.address,
    //                 "amount": [
    //                     {
    //                         "denom": "ubnt",
    //                         "amount": `${amount}000000`
    //                     }
    //                 ]
    //             }
    //         }, gasInfo
    //     );
    // }
    //
    //
    // delegate(valoper: string, amount: number, gasInfo: GasInfo) {
    //     return this.sendMessage({
    //         "type": "cosmos-sdk/MsgDelegate",
    //         "value": {
    //             "delegator_address": this.address,
    //             "validator_address": valoper,
    //             "amount": {
    //                 "denom": "ubnt",
    //                 "amount": `${amount}000000`
    //             }
    //         }
    //     }, gasInfo)
    // }
    //
    //
    // delete(key: string, gasInfo: GasInfo): Promise<TxResult> {
    //     return mnemonicToAddress(this.mnemonic)
    //         .then(address => sendMessage<MsgDelete, void>(this.communicationService, {
    //             typeUrl: "/bluzelle.curium.crud.MsgDelete",
    //             value: {
    //                 key: key,
    //                 uuid: this.uuid,
    //                 creator: address,
    //             }
    //         }, gasInfo))
    //         .then(x => x)
    //         .then(standardTxResult)
    // }
    //
    // deleteAll(gasInfo: GasInfo): Promise<TxResult> {
    //     return sendMessage<DeleteAllMessage, void>(this.communicationService, {
    //         type: 'crud/deleteall',
    //         value: {
    //             UUID: this.uuid,
    //             Owner: this.address
    //         }
    //     }, gasInfo)
    //         .then(standardTxResult)
    // }
    //
    // getAddress(): Promise<string> {
    //     return mnemonicToAddress(this.mnemonic);
    // }
    //
    // getLease(key: string): Promise<number> {
    //     return this.#abciQuery<QueryGetLeaseResult & { error: string }>(`/custom/crud/getlease/${this.uuid}/${key}`)
    //         .then(x => x.result)
    //         .then(res => Math.round(res.lease * BLOCK_TIME_IN_SECONDS))
    //         .catch(res => {
    //             throw res.error === 'Not Found' ? `key "${key}" not found` : res.error
    //         })
    // }
    //
    // generateBIP39Account = (entropy: string = ''): string => {
    //     assert(entropy.length === 0 || entropy.length === 64, 'Entropy must be 64 char hex');
    //     return entropy ? entropyToMnemonic(entropy) : generateMnemonic(256);
    // }
    //
    // async getNShortestLeases(count: number) {
    //     assert(count >= 0, ClientErrors.INVALID_VALUE_SPECIFIED);
    //     return this.#abciQuery<QueryGetNShortestLeasesResult>(`/custom/crud/getnshortestleases/${this.uuid}/${count}`)
    //         .then(x => x.result)
    //         .then(res => res.keyleases.map(({key, lease}) => ({
    //             key,
    //             lease: Math.round(parseInt(lease) * BLOCK_TIME_IN_SECONDS)
    //         })));
    // }
    //
    // getTx(txhash: string): Promise<TransactionResponse> {
    //     return this.#query<TransactionResponse>(`txs/${txhash}`)
    // }
    //
    // getBNT({ubnt, address}: { ubnt?: boolean, address?: string } = {
    //     ubnt: false,
    //     address: this.address
    // }): Promise<number> {
    //     return this.account(address)
    //         .then(a => a.coins[0]?.amount || '0')
    //         .then(a => ubnt ? a : a.slice(0, -6) || '0')
    //         .then(parseInt)
    // }
    //
    // has(key: string): Promise<boolean> {
    //     return this.#abciQuery<QueryHasResult>(`/custom/crud/has/${this.uuid}/${key}`)
    //         .then(x => x.result.has)
    // }
    //
    // keys(): Promise<string[]> {
    //     return getRpcClient(this.url)
    //         .then(client => client.CrudValueAll({uuid: this.uuid}))
    //         .then(x => x.CrudValue)
    //         .then(values => values.map((v: any) => v.key))
    // }
    //
    // keyValues(): Promise<{ key: string, value: string }[]> {
    //     return this.#abciQuery<QueryKeyValuesResult>(`/custom/crud/keyvalues/${this.uuid}`)
    //         .then(x => x.result)
    //         .then(res => res.keyvalues)
    //         .then(keyvalues => keyvalues.map(({key, value}) => ({key, value: value})))
    // }
    //
    // async mint(address: string, gasInfo: GasInfo): Promise<TxResult> {
    //     assert(!!address, ClientErrors.ADDRESS_MUST_BE_A_STRING);
    //     assert(typeof address === 'string', ClientErrors.ADDRESS_MUST_BE_A_STRING);
    //
    //     return sendMessage<MintMessage, void>(this.communicationService, {
    //         type: "faucet/Mint",
    //         value: {
    //             Minter: address,
    //             Sender: this.address,
    //             Time: Date.now().toString()
    //         }
    //     }, gasInfo)
    //         .then(standardTxResult);
    // }
    //
    // async multiUpdate(keyValues: { key: string, value: string }[], gasInfo: GasInfo): Promise<TxResult> {
    //     assert(Array.isArray(keyValues), 'keyValues must be an array');
    //
    //     keyValues.forEach(({key, value}, index, array) => {
    //         assert(typeof key === 'string', ClientErrors.ALL_KEYS_MUST_BE_STRINGS);
    //         assert(typeof value === 'string', ClientErrors.ALL_VALUES_MUST_BE_STRINGS);
    //     });
    //
    //     return sendMessage<MultiUpdateMessage, void>(this.communicationService, {
    //         type: 'crud/multiupdate',
    //         value: {
    //             KeyValues: keyValues,
    //             UUID: this.uuid,
    //             Owner: this.address
    //         }
    //     }, gasInfo)
    //         .then(standardTxResult)
    // }
    //
    // myKeys(): Promise<string[]> {
    //     return this.#abciQuery<QueryKeysResult>(`/custom/crud/mykeys/${this.address}/${this.uuid}`)
    //         .then(x => x.result)
    //         .then(res => res.keys)
    //         .catch((x) => {
    //             throw x
    //         });
    // }
    //
    // query<T>(queryString: string): Promise<T> {
    //     return this.#query<T>(queryString);
    // }
    //
    // abciQuery<T>(method: string, data: unknown = {}): Promise<ABCIResponse<T>> {
    //     return this.#abciQuery<T>(method, data);
    // }
    //
    // owner(key: string): Promise<string> {
    //     return this.#abciQuery<QueryOwnerResult>(`/custom/crud/owner/${this.uuid}/${key}`)
    //         .then(x => x.result)
    //         .then(res => res.owner)
    //         .catch((x) => {
    //             if (x instanceof Error) {
    //                 throw x;
    //             }
    //             throw(new Error(x.error === 'Not Found' ? `key "${key}" not found` : x.error))
    //         });
    // }
    //
    read(key) {
        return this.getClient()
            .then(client => client.q.CrudValue({
            uuid: this.config.uuid,
            key
        }))
            .then(x => { var _a; return (_a = x.CrudValue) === null || _a === void 0 ? void 0 : _a.value; })
            .then(x => new TextDecoder().decode(x));
    }
}
exports.API = API;
const getRpcClient = (url) => {
    return tendermint_rpc_1.Tendermint34Client.connect(url)
        .then(tendermintClient => new stargate_1.QueryClient(tendermintClient))
        .then(stargate_1.createProtobufRpcClient)
        .then(rpcClient => new query_1.QueryClientImpl(rpcClient));
};
const MINUTE = 60;
const HOUR = MINUTE * 60;
const DAY = HOUR * 24;
const convertLease = ({ seconds = 0, minutes = 0, hours = 0, days = 0 }) => Math.round((seconds + (minutes * MINUTE) + (hours * HOUR) + (days * DAY)) / BLOCK_TIME_IN_SECONDS) || Math.round((DAY * 10) / BLOCK_TIME_IN_SECONDS);
const findMine = (res, condition) => {
    for (let i = 0; i < res.data.length; i++) {
        if (condition(res.data[i])) {
            const found = res.data[i];
            lodash_1.pullAt(res.data, i);
            return { res, data: found };
        }
    }
    return { res, data: undefined };
};
const standardTxResult = (res) => ({
    txhash: res.txhash,
    height: res.height,
});
const bz = new API({
    url: "http://localhost:26657",
    mnemonic: "loan arrow prison cloud rain diamond parrot culture marriage forget win brief kingdom response try image auto rather rare tone chef can shallow bus",
    uuid: "uuid",
    gasPrice: 0.002,
    maxGas: 300000
});
bz.read("nick2")
    .then(x => x);
//# sourceMappingURL=API.js.map