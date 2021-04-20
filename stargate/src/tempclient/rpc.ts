import {QueryClientImpl} from "../codec/crud/query";
import {Tendermint34Client} from "@cosmjs/tendermint-rpc";
import {createProtobufRpcClient, ProtobufRpcClient, QueryClient} from "@cosmjs/stargate";
import {MsgClientImpl} from "../codec/crud/tx";
import Long from "long";
import {newCommunicationService, sendMessage} from "./tempCommunicationService"
import * as MsgTypes from "../codec/crud/tx";
import {addMessageType} from "./TempRegistry";
import {DirectSecp256k1HdWallet} from "@cosmjs/proto-signing";
import {memoize} from 'lodash'


interface SDKOptions {
    mnemonic?: string,
    url: string
}

const sdk = (options: SDKOptions) =>
    Promise.all([
            queryRpc(options),
            txRpc(options),
            mnemonicToAddress(options.mnemonic || '')
        ])
        .then(([queryRpc, txRpc, address]) => ({
            q: new QueryClientImpl(queryRpc),
            tx: new MsgClientImpl(txRpc),
            address
        }))


const queryRpc = (options: SDKOptions): Promise<ProtobufRpcClient> =>
    Tendermint34Client.connect(options.url)
        .then(tendermintClient => new QueryClient(tendermintClient))
        .then(createProtobufRpcClient)


const txRpc = (options: SDKOptions): Promise<ProtobufRpcClient> =>
    Promise.resolve({
        request: (service, method, data): Promise<Uint8Array> => {
            return Promise.resolve(addMessageType(`/${service}${method}`, (MsgTypes as any)[`Msg${method}`]))
                .then(() => sendMessage<any, any>(newCommunicationService(options.url, options.mnemonic || ''), {
                typeUrl: `/${service}${method}`,
                value: (MsgTypes as any)[`Msg${method}`].decode(data)
            }, {gas_price: 0.004}))
                .then(x => x)
                .then(messageResponse => messageResponse.data[0])

        }
    } as ProtobufRpcClient)

const mnemonicToAddress = memoize<(mnemonic: string) => Promise<string>>((mnemonic: string): Promise<string> =>
    DirectSecp256k1HdWallet.fromMnemonic(mnemonic, undefined, 'bluzelle')
        .then(wallet => wallet.getAccounts())
        .then(x => x[0].address))

sdk({
    mnemonic: "loan arrow prison cloud rain diamond parrot culture marriage forget win brief kingdom response try image auto rather rare tone chef can shallow bus",
    url: "http://localhost:26657"
})
    .then(client => client.tx.Create({
        creator: client.address,
        uuid: 'uuid',
        key: 'key',
        value: new Uint8Array([1,2,3]),
        lease: Long.fromInt(300),
        metadata: new Uint8Array
    }))
    .then(x => x)
    // .then(sdkClient => sdkClient.q.CrudValue({
    //     key: "value",
    //     uuid: "uuid"
    // }))
    .then(console.log)
