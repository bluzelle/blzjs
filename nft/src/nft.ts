import {CommunicationService, newCommunicationService, sendMessage, withTransaction} from "@bluzelle/sdk-js/lib/CommunicationService";
import {QueryClientImpl} from "@bluzelle/sdk-js/lib/codec/nft/query";
import {MsgClientImpl} from "@bluzelle/sdk-js/lib/codec/nft/tx";
import {SDKOptions} from "@bluzelle/sdk-js/lib/rpc";
import {addMessageType} from "@bluzelle/sdk-js/lib/Registry";
import * as MsgTypes from "@bluzelle/sdk-js/lib/codec/nft/tx";
import {memoize, chunk} from 'lodash'
import {createProtobufRpcClient, ProtobufRpcClient, QueryClient} from "@cosmjs/stargate";
import {DirectSecp256k1HdWallet} from "@cosmjs/proto-signing";
import {Tendermint34Client} from "@cosmjs/tendermint-rpc";
import {passThroughAwait} from "promise-passthrough";
import Long from 'long'
import {Some} from "monet";
import {readFileSync} from "fs";

export interface SDK {
    q: QueryClientImpl,
    tx: MsgClientImpl,
    address: string,
    withTransaction: (fn: () => unknown, options: {memo: string}) => unknown
}


const sdk = (options: SDKOptions): Promise<SDK> => {
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

type Receipt = {
    MsgType: string,
    data: Uint8Array
}

const mnemonic = "oak ordinary next choose firm pave cry rescue fetch staff joy deputy purchase display bus outside pen must enroll age oppose climb vanish shoe";

const getClient = memoize(() => sdk({
        mnemonic,
        url: 'http://localhost:26657',
        maxGas: 10000000,
        gasPrice: 0.002
    })
);

interface Ctx {
    address: string,
    client: SDK,
    id: Long,

}

setTimeout(() => {
    const file = readFileSync("./image.png");
    storeNft('meta', file)
});

const storeNft = (meta: unknown, data: Uint8Array): Promise<number> =>
    getClient()
        .then(client => ({client} as Ctx))
        .then(passThroughAwait(ctx => mnemonicToAddress(mnemonic).then(address => ctx.address = address)))
        .then(passThroughAwait(ctx => ctx.client.tx.CreateNft({
            creator: ctx.address,
            meta: JSON.stringify(meta)
        }).then(x => {ctx.id = x.id})))
        .then(passThroughAwait(ctx => sendChunks(ctx, data)))
        .then(ctx => ctx.id)
        .then(x => x.toInt())
        .then(x => x)


const sendChunks = (ctx: Ctx, data: Uint8Array) =>
    Promise.all(Uint8ArrayChunk(data, 100000).map((data, idx) => sendChunk(ctx, data, idx)))

const sendChunk = (ctx: Ctx, data: Uint8Array, idx: number) =>
    ctx.client.tx.Chunk({
        id: ctx.id,
        chunk: Long.fromNumber(idx),
        creator: ctx.address,
        data
    })

const Uint8ArrayChunk = (data: Uint8Array, size: number): Uint8Array[] =>
    Some(data)
        .map(arr => arr.map(x => x))
        .map(arr => chunk(arr, size))
        .map(arr => arr.map(x => Uint8Array.from(x)))
        .join()

