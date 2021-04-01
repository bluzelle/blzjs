import {GasInfo} from "../types/GasInfo";
import {Either, Left, None, Right, Some} from "monet";
import {API} from "../API";
import {MessageResponse} from "../types/MessageResponse";
import {Message} from "../types/Message";
import {memoize} from 'lodash'
import {passThrough} from "promise-passthrough";
import delay from "delay";
import {DirectSecp256k1HdWallet, EncodeObject, GeneratedType, Registry} from "@cosmjs/proto-signing";
import {defaultRegistryTypes, SigningStargateClient} from "@cosmjs/stargate";
import {MsgCreateCrudValue} from "../codec/crud/tx";
import {TxRaw} from "@cosmjs/proto-signing/build/codec/cosmos/tx/v1beta1/tx";

const cosmosjs = require('@cosmostation/cosmosjs');


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
    api: API
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


const newTransactionMessageQueue = (items: MessageQueueItem<unknown>[], memo: string): TransactionMessageQueue => ({
    memo,
    items
})


export const newCommunicationService = (api: API) => ({
    api,
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
                                .cata(() => reject(e), () => {})
                        );
                }
            )
            // hacky way to make sure that connections arrive at server in order
            .then(() => delay(200))
    });


const transmitTransaction = (service: CommunicationService, messages: MessageQueueItem<any>[], {memo}: { memo: string }): Promise<any> => {
    let cosmos: SigningStargateClient;
    return getClient(service.api)
        .then(c => cosmos = c)
        .then(client => getChainId(client).then(chainId => service.api.chainId = chainId))
        .then(() => getSequence(service, cosmos))
        .then((account) => cosmos.sign(service.api.address, messages.map(x => x.message) as EncodeObject[],getFeeInfo(combineGas(messages)) , 'memo', {
            accountNumber: account.account,
            chainId: service.api.chainId,
            sequence: account.seq
        })
            .then((txRaw: TxRaw) => Uint8Array.from(TxRaw.encode(txRaw).finish()))
            .then((signedTx: Uint8Array) => cosmos.broadcastTx(signedTx))
            .then(x => x)

                // .map(cosmos.newStdMsg.bind(cosmos))
                // .map((stdSignMsg: any) => cosmos.sign(stdSignMsg, cosmos.getECPairPriv(service.api.mnemonic), 'block'))
                // .map(cosmos.broadcast.bind(cosmos))
//                .map((p: any) => p
//                     .then(convertDataFromHexToString)
//                     .then(convertDataToObject)
                    .then(checkErrors)
                    .catch((e: FailedTransaction) => {
                        /signature verification failed/.test(e.error) && (service.accountRequested = undefined)
                        throw e
                    })
                    .then((x: any) => ({...x, height: x.height}))
                // )
                // .join()
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
            service.accountRequested = cosmos.getAccount(service.api.address)
                .then((data: any) => {
                    service.seq = data.sequence
                    service.account = data.accountNumber
                })
        ))
            .then(() => ({
                seq: service.seq,
                account: service.account
            }));


const convertDataFromHexToString = (res: any) => ({
    ...res,
    data: res.data ? Buffer.from(res.data, 'hex').toString() : undefined
})

const eitherJsonParse = <T>(json: string): Either<Error, T> => {
    try {
        return Right(JSON.parse(json))
    } catch (e) {
        return Left(e)
    }
}

const convertDataToObject = (res: any) =>
    Right(res)
        .flatMap(res => res.data === undefined ? Left(res) : Right(res))
        .map(res => `[${res.data.split('}{').join('},{')}]`)
        .flatMap(eitherJsonParse)
        .map(data => ({...res, data}))
        .catchMap(x => Right(res))
        .join()

const checkErrors = (res: any) => {
    if (res.error) {
        throw {
            txhash: res.transactionHash,
            height: res.height,
            error: res.error
        }
    }
    if (/signature verification failed/.test(res.rawLog)) {
        throw {
            txhash: res.transactionHash,
            height: res.height,
            error: 'signature verification failed'
        } as FailedTransaction
    }
    if (/insufficient fee/.test(res.rawLog)) {
        let [x, error] = res.rawLog.split(/[:;]/);
        throw {
            txhash: res.transactionHash,
            height: res.height,
            error: error.trim()
        } as FailedTransaction
    }
    if (/failed to execute message/.test(res.rawLog)) {
        const error = res.rawLog.split(':')[2];
        throw {
            txhash: res.transactionHash,
            height: res.height,
            error: error.trim()
        } as FailedTransaction
    }
    if (/^\[.*\]$/.test(res.rawLog) === false) {
        throw {
            txhash: res.transactionHash,
            height: res.height,
            failedMsg: undefined,
            failedMsgIdx: undefined,
            error: res.rawLog
        }
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

export const getCosmos = memoize((api: API): Promise<any> =>
    fetch(`${api.url}/node_info`)
        .then(x => x.json())
        .then(x => x.node_info.network)
        .then(chainId => cosmosjs.network(api.url, chainId))
        .then(passThrough<any>(cosmos => cosmos.setPath("m/44\'/118\'/0\'/0/0")))
        .then(passThrough<any>(cosmos => cosmos.bech32MainPrefix = 'bluzelle'))
)

const myRegistry = new Registry([
    ...defaultRegistryTypes,
    ["/bluzelle.curium.crud.MsgCreateCrudValue", MsgCreateCrudValue]
] as Iterable<[string, GeneratedType]>);

// Inside an async function...
const getSigner = (mnemonic: string) => DirectSecp256k1HdWallet.fromMnemonic(
    mnemonic,
    undefined,
    "bluzelle",
);


export const getClient = memoize((api: API) =>
    getSigner(api.mnemonic)
        .then(signer => SigningStargateClient.connectWithSigner(
            api.url,
            signer,
            {
                registry: myRegistry,
            }
        )));

const getChainId = memoize<(client: SigningStargateClient) =>Promise<string>>((client) => client.getChainId())


