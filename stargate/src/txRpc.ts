import {mnemonicToAddress, sendMessage} from "./services/CommunicationService"
import * as MsgTypes from "./codec/crud/tx";
import {bluzelle} from "./bluzelle-node";
import {addMessageType} from "./services/Registry";
import {MsgRead} from "./codec/crud/tx";




export interface txRpc {
    request(service: string, method: string, data: Uint8Array): Promise<Uint8Array>;
}

const bz = bluzelle({
    mnemonic: "loan arrow prison cloud rain diamond parrot culture marriage forget win brief kingdom response try image auto rather rare tone chef can shallow bus",
    endpoint: "http://localhost:26657",
    uuid: "temp"
})


const processTx = (service: string, method: string, data: Uint8Array): Promise<Uint8Array> =>
    Promise.resolve(addMessageType(`/${service}${method}`, (MsgTypes as any)[`Msg${method}`]))
        .then(() => sendMessage<Uint8Array, Uint8Array>(bz.communicationService, {
            typeUrl: `/${service}${method}`,
            value: data
        }, {gas_price: 0.004}))
        .then((response) => response.data[0])

export const rpcClient: txRpc = {
    request: processTx
}