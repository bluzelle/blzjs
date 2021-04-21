import {QueryClientImpl} from "./codec/crud/query";
import {Tendermint34Client} from "@cosmjs/tendermint-rpc";
import {createProtobufRpcClient, ProtobufRpcClient, QueryClient} from "@cosmjs/stargate";
import {MsgClientImpl} from "./codec/crud/tx";
import Long from "long";
import {newCommunicationService, sendMessage, withTransaction, CommunicationService} from "./CommunicationService"
import * as MsgTypes from "./codec/crud/tx";
import {addMessageType} from "./Registry";
import {DirectSecp256k1HdWallet} from "@cosmjs/proto-signing";
import {memoize} from 'lodash'

export interface SDKOptions {
    mnemonic?: string,
    url: string,
    gasPrice: number,
    maxGas: number
}

export interface SDK {
    q: QueryClientImpl,
    tx: MsgClientImpl,
    address: string,
    withTransaction: (fn: () => unknown, options: {memo: string}) => unknown
}

export const sdk = (options: SDKOptions): Promise<SDK> => {
    const cs = newCommunicationService(options.url, options.mnemonic || '')

    return Promise.all([
        queryRpc(options),
        txRpc(options, cs),
        mnemonicToAddress(options.mnemonic || '')
    ])
        .then(([queryRpc, txRpc, address]) => ({
            q: new QueryClientImpl(queryRpc),
            tx: new MsgClientImpl(txRpc),
            address,
            withTransaction: (fn: () => unknown, options: { memo: string }) => withTransaction(cs, fn, options)
        }))
}


const queryRpc = (options: SDKOptions): Promise<ProtobufRpcClient> =>
    Tendermint34Client.connect(options.url)
        .then(tendermintClient => new QueryClient(tendermintClient))
        .then(createProtobufRpcClient)

type Receipt = {
    MsgType: string,
    data: Uint8Array
}

const txRpc = (options: SDKOptions, communicationService: CommunicationService): Promise<ProtobufRpcClient> => {
    return Promise.resolve({
        request: (service, method, data): Promise<Uint8Array> => {
            addMessageType(`/${service}${method}`, (MsgTypes as any)[`Msg${method}`]);
            return sendMessage<any, Receipt>(communicationService, {
                typeUrl: `/${service}${method}`,
                value: (MsgTypes as any)[`Msg${method}`].decode(data)
            }, {gas_price: options.gasPrice, max_gas: options.maxGas})
                .then(messageResponse => messageResponse?.data?.[0]?.data ?? new Uint8Array())
        }
    } as ProtobufRpcClient);
}

const mnemonicToAddress = memoize<(mnemonic: string) => Promise<string>>((mnemonic: string): Promise<string> =>
    DirectSecp256k1HdWallet.fromMnemonic(mnemonic, undefined, 'bluzelle')
        .then(wallet => wallet.getAccounts())
        .then(x => x[0].address))

sdk({
    mnemonic: "loan arrow prison cloud rain diamond parrot culture marriage forget win brief kingdom response try image auto rather rare tone chef can shallow bus",
    url: "http://localhost:26657",
    gasPrice: 0.002,
    maxGas: 100000
})
    .then(client =>
        client.withTransaction(() => {
            client.tx.Create({
                    creator: client.address,
                    uuid: 'uuid',
                    key: 'nick2',
                    value: new TextEncoder().encode('HELLO'),
                    lease: Long.fromInt(3000),
                    metadata: new Uint8Array()
                })
            client.tx.Read({
                creator: client.address,
                uuid: 'uuid',
                key: 'nick2',
            })

        }, {memo: ''})
    )
    // .then(passThroughAwait((client) => client.tx.Create({
    //     creator: client.address,
    //     uuid: 'uuid',
    //     key: 'nick',
    //     value: new TextEncoder().encode('HELLO'),
    //     lease: Long.fromInt(3000),
    //     metadata: new Uint8Array()
    // })))
    // .then((client) => client.tx.Create({
    //     creator: client.address,
    //     uuid: 'uuid',
    //     key: 'john',
    //     value: new TextEncoder().encode('HELLO'),
    //     lease: Long.fromInt(3000),
    //     metadata: new Uint8Array()
    // }))
    // .then(client => client.tx.Read({
    //     creator: client.address,
    //     uuid: 'uuid',
    //     key: 'nick',
    // }))
    .then(x => x)
    // .then(sdkClient => sdkClient.q.CrudValue({
    //     key: "value",
    //     uuid: "uuid"
    // }))
    .then(console.log)
