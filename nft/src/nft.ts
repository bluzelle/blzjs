import {CommunicationService, newCommunicationService, sendMessage, withTransaction} from "@bluzelle/sdk-js/lib/CommunicationService";
import {QueryClientImpl} from "@bluzelle/sdk-js/lib/codec/nft/query";
import {MsgClientImpl} from "@bluzelle/sdk-js/lib/codec/nft/tx";
import {SDKOptions} from "@bluzelle/sdk-js/lib/rpc";
import {addMessageType} from "@bluzelle/sdk-js/lib/Registry";
import * as MsgTypes from "@bluzelle/sdk-js/lib/codec/nft/tx";
import {memoize} from 'lodash'
import {createProtobufRpcClient, ProtobufRpcClient, QueryClient} from "@cosmjs/stargate";
import {DirectSecp256k1HdWallet} from "@cosmjs/proto-signing";
import {Tendermint34Client} from "@cosmjs/tendermint-rpc";

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


const c = sdk({
    mnemonic: "method uncover online album combine relief episode congress hidden forest state kitten perfect office tank dress purity sphere ivory canyon extend record bread summer",
    url: 'http://localhost:26657',
    maxGas: 100000,
    gasPrice: 0.002
})

const mnemonic = "oak ordinary next choose firm pave cry rescue fetch staff joy deputy purchase display bus outside pen must enroll age oppose climb vanish shoe";

const getClient = memoize(() => sdk({
        mnemonic,
        url: 'http://localhost:26657',
        maxGas: 100000,
        gasPrice: 0.002
    })
);


const storeNft = (meta: string, data: Uint8Array): Promise<string> =>
    Promise.all([
        getClient(),
        mnemonicToAddress(mnemonic),
    ])
    .then(([client, address]) => client.tx.CreateNft({
        creator: address,
        meta: meta
    }))
        .then(x => x.id);

storeNft("meta", new TextEncoder().encode("data"))
    .then(x => x);



