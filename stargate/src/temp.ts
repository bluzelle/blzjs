import {QueryClientImpl} from "./codec/crud/query";
import {Tendermint34Client} from "@cosmjs/tendermint-rpc";
import {createProtobufRpcClient, QueryClient, SigningStargateClient} from "@cosmjs/stargate";
import {memoize} from "lodash";
import {API} from "./API";
import {myRegistry} from "./services/Registry";
import {DirectSecp256k1HdWallet} from "@cosmjs/proto-signing";
import {MsgClientImpl} from "./codec/crud/tx";
import {bluzelle} from "./bluzelle-node";
import {rpcClient} from "./txRpc"

const getRpcClient = (url: string): Promise<QueryClientImpl> => {
    return Tendermint34Client.connect(url)
        .then(tendermintClient => new QueryClient(tendermintClient))
        .then(createProtobufRpcClient)
        .then(rpcClient => new QueryClientImpl(rpcClient))
}

export const mnemonicToAddress = (mnemonic: string): Promise<string> =>
    DirectSecp256k1HdWallet.fromMnemonic(mnemonic, undefined, 'bluzelle')
        .then(wallet => wallet.getAccounts())
        .then(x => x[0].address)

export const getClient = memoize((api: API) =>
    getSigner(api.mnemonic)
        .then(signer => SigningStargateClient.connectWithSigner(
            api.url,
            signer,
            {
                registry: myRegistry,
            }
        ))
        .then(stargateClient => stargateClient));

const bz = bluzelle({
    mnemonic: "loan arrow prison cloud rain diamond parrot culture marriage forget win brief kingdom response try image auto rather rare tone chef can shallow bus",
    endpoint: "http://localhost:26657",
    uuid: "temp"
})

const address = mnemonicToAddress(bz.mnemonic)

export const getTxRpcClient = () =>
    Promise.resolve(rpcClient)
        .then(c => new MsgClientImpl(c))

const getSigner = (mnemonic: string) => DirectSecp256k1HdWallet.fromMnemonic(
    mnemonic,
    undefined,
    "bluzelle",
);

