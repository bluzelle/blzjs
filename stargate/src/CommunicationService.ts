import {GasInfo} from "./legacyAdapter/types/GasInfo";
import {Some} from "monet";
import {MessageResponse} from "./legacyAdapter/types/MessageResponse";
import {Message} from "./legacyAdapter/types/Message";
import {memoize} from 'lodash'
import delay from "delay";
import {DirectSecp256k1HdWallet, EncodeObject} from "@cosmjs/proto-signing";
import {BroadcastTxFailure, BroadcastTxResponse, SigningStargateClient} from "@cosmjs/stargate";
import {TxRaw} from "@cosmjs/proto-signing/build/codec/cosmos/tx/v1beta1/tx";
import {myRegistry} from "./Registry";

const TOKEN_NAME = 'ubnt';

interface MessageQueueItem<T> {
    message: Message<T>
    gasInfo: GasInfo
}

interface FailedTransaction {
    txhash: string
    height: number
    failedMsg?: Message<any>
    failedMsgIdx?: number
    error: string
}


const dummyMessageResponse = {
    height: 0,
    txhash: '',
    gas_used: '',
    gas_wanted: '',
    data: []
}

export interface CommunicationService {
    mnemonic: string
    url: string
    seq: number
    account: number
    accountRequested?: Promise<unknown>
    transactionMessageQueue?: TransactionMessageQueue
}

interface TransactionMessageQueue {
    memo: string
    items: MessageQueueItem<unknown>[]
}

export interface WithTransactionsOptions {
    memo: string
}

export const mnemonicToAddress = (mnemonic: string): Promise<string> =>
    DirectSecp256k1HdWallet.fromMnemonic(mnemonic, undefined, 'bluzelle')
        .then(wallet => wallet.getAccounts())
        .then(x => x[0].address)


const newTransactionMessageQueue = (items: MessageQueueItem<unknown>[], memo: string): TransactionMessageQueue => ({
    memo,
    items
})


export const newCommunicationService = (url: string, mnemonic: string) => ({
    url,
    mnemonic,
    seq: 0,
    account: 0
})

export const withTransaction = <T>(service: CommunicationService, fn: () => T, {memo}: WithTransactionsOptions): Promise<MessageResponse<T>> => {
    if (service.transactionMessageQueue) {
        throw new Error('withTransaction() can not be nested')
    }
    service.transactionMessageQueue = newTransactionMessageQueue([], memo);
    fn();
    const result = sendMessages(service, service.transactionMessageQueue)
    service.transactionMessageQueue = undefined;
    return result;
}


export const sendMessage = <T, R>(ctx: CommunicationService, message: Message<T>, gasInfo: GasInfo): Promise<MessageResponse<R>> => {
    return ctx.transactionMessageQueue ? Promise.resolve(ctx.transactionMessageQueue?.items.push({
            message, gasInfo
        }))
            .then(() => (dummyMessageResponse))
        : sendMessages(ctx, newTransactionMessageQueue([{
            message,
            gasInfo
        }], ''))
}


const sendMessages = (service: CommunicationService, queue: TransactionMessageQueue, retrans: boolean = false): Promise<MessageResponse<any>> =>
    new Promise((resolve, reject) => {
        msgChain = msgChain
            .then(() => {
                    transmitTransaction(service, queue.items, {memo: queue.memo})
                        .then(resolve)
                        .catch(e =>
                            Some(retrans)
                                .filter(retrans => retrans === false)
                                .filter(() => /signature verification failed/.test(e.error))
                                .map(() => service.seq = 0)
                                .map(() => service.account = 0)
                                .map(() => sendMessages(service, queue, true))
                                .map(p => p.then(resolve).catch(reject))
                                .cata(() => reject(e), () => {
                                })
                        );
                }
            )
            // hacky way to make sure that connections arrive at server in order
            .then(() => delay(200))
    });

let chainId: string
const transmitTransaction = (service: CommunicationService, messages: MessageQueueItem<any>[], {memo}: { memo: string }): Promise<any> => {
    let cosmos: SigningStargateClient;
    return getClient(service)
        .then(c => cosmos = c)
        .then(client => getChainId(client).then(cId => chainId = cId))
        .then(() => getSequence(service, cosmos))
        .then((account) =>
            mnemonicToAddress(service.mnemonic)
                .then(address => cosmos.sign(address, messages.map(x => x.message) as EncodeObject[], getFeeInfo(combineGas(messages)), 'memo', {
                        accountNumber: account.account,
                        chainId: chainId,
                        sequence: account.seq
                    })
                )
                .then((txRaw: TxRaw) => Uint8Array.from(TxRaw.encode(txRaw).finish()))
                .then((signedTx: Uint8Array) => cosmos.broadcastTx(signedTx))
                .then(res => checkErrors(res as BroadcastTxFailure))
                .catch((e: FailedTransaction) => {
                    /signature verification failed/.test(e.error) && (service.accountRequested = undefined)
                    throw e
                })
                .then((x: any) => ({...x, txhash: x.transactionHash}))
                .then(x => x)
        )

}

let msgChain = Promise.resolve()


interface State {
    seq: number
    account: number
}

const getSequence = (service: CommunicationService, cosmos: SigningStargateClient): Promise<State> =>
    (service.accountRequested ? (
        service.accountRequested = service.accountRequested
            .then(() =>
                service.seq = service.seq + 1
            )
    ) : (
        mnemonicToAddress(service.mnemonic)
            .then(address =>
                service.accountRequested = cosmos.getAccount(address)
                .then((data: any) => {
                    if (!data) {
                        throw 'Invalid account: check your mnemonic'
                    }
                    service.seq = data.sequence
                    service.account = data.accountNumber
                }))

    ))
        .then(() => ({
            seq: service.seq,
            account: service.account
        }));


const convertDataFromHexToString = (res: any) => ({
    ...res,
    data: res.data ? Buffer.from(res.data, 'hex').toString() : undefined
})

const checkErrors = (res: BroadcastTxFailure): BroadcastTxResponse => {
    if (res.code > 0) {
        throw res.rawLog
    }
    return res

}

const getFeeInfo = ({max_fee, gas_price = 0.002, max_gas = 10000000}: GasInfo) => ({
    amount: [{
        denom: TOKEN_NAME,
        amount: (max_fee ? max_fee : max_gas * gas_price).toString()
    }],
    gas: max_gas.toString()
});

const combineGas = (transactions: MessageQueueItem<any>[]): GasInfo =>
    transactions.reduce((gasInfo: GasInfo, transaction: MessageQueueItem<any>) => {
        return {
            max_gas: (gasInfo.max_gas || 0) + (transaction.gasInfo.max_gas || 200000),
            max_fee: (gasInfo.max_fee || 0) + (transaction.gasInfo.max_fee || 0),
            gas_price: Math.max(gasInfo.gas_price || 0, transaction.gasInfo.gas_price || 0)
        } as GasInfo
    }, {});


// Inside an async function...
const getSigner = (mnemonic: string) => DirectSecp256k1HdWallet.fromMnemonic(
    mnemonic,
    undefined,
    "bluzelle",
);


export const getClient = memoize((service) =>
    getSigner(service.mnemonic)
        .then(signer => SigningStargateClient.connectWithSigner(
            service.url,
            signer,
            {
                registry: myRegistry,
            }
        )));

const getChainId = memoize<(client: SigningStargateClient) => Promise<string>>((client) => client.getChainId())


