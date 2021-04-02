import {MsgCreateCrudValue} from "./codec/crud/tx";
import {memoize} from 'lodash'
import {DirectSecp256k1HdWallet, GeneratedType, Registry} from "@cosmjs/proto-signing";
import { defaultRegistryTypes, SigningStargateClient } from "@cosmjs/stargate";
import {bluzelle} from "./bluzelle-node";

const bz = bluzelle({
    mnemonic: "visit sleep poem rigid coin hour balcony bone rare ring excess document empty extra sibling decide goddess tourist kidney segment true crane subway cousin",
    endpoint: 'http://localhost:26657',
    uuid: ''
});

bz.create('foo91', 'bar', {gas_price: 0.002})
    .then(x => console.log(x))
    .catch(e => console.log(e));

bz.read('foo3')
    .then(x => console.log('READ:', x));



// const myRegistry = new Registry([
//     ...defaultRegistryTypes,
//     ["/bluzelle.curium.crud.MsgCreateCrudValue", MsgCreateCrudValue]
// ] as Iterable<[string, GeneratedType]>);
//
// // Inside an async function...
// const getSigner = (mnemonic: string) => DirectSecp256k1HdWallet.fromMnemonic(
//     mnemonic,
//     undefined,
//     "bluzelle",
// );
//
//
// export const getClient = memoize((mnemonic: string) =>
//     getSigner(mnemonic)
//         .then(signer => SigningStargateClient.connectWithSigner(
//             "http://localhost:26657",
//             signer,
//             {
//                 registry: myRegistry,
//             }
//         )));
//
//
//
//

// const create = (key: string, value: string) /*Promise<BroadcastTxResponse>*/ => {
//     const message = {
//         typeUrl: "/bluzelle.curium.crud.MsgCreateCrudValue",
//         value: {
//             uuid: 'uuid',
//             key: key,
//             value: value,
//             creator: "bluzelle1uvxd0kvd5nztaadrjsae3kc3cea6z3mtcpgxrl",
//             height: new Long(0),
//             lease: new Long(0)
//         } as MsgCreateCrudValue,
//     };
//     const fee = {
//         amount: [
//             {
//                 denom: "ubnt",
//                 amount: "120000",
//             },
//         ],
//         gas: "1000000",
//     };
//
//
//    const getChainId = memoize<(client: SigningStargateClient) =>Promise<string>>((client) => client.getChainId())
//
//


//     return getClient("visit sleep poem rigid coin hour balcony bone rare ring excess document empty extra sibling decide goddess tourist kidney segment true crane subway cousin")
//         .then(client => getChainId(client).then(chainId => ({client, chainId})))
//         .then(ctx => ctx.client.sign(myAddress,[message], fee, 'memo', {
//             accountNumber: 0,
//             chainId: ctx.chainId,
//             sequence: seq++
//         })
//             .then(txRaw => ({...ctx, txRaw}))
//         )
//         .then(ctx => ({
//             ...ctx,
//             signedTx: Uint8Array.from(TxRaw.encode(ctx.txRaw).finish())
//         })
//         )
//         .then(ctx => ctx.client.broadcastTx(ctx.signedTx))
// }
//
// Promise.all([
//     create('eeeeeeee', 'ccccccccc'),
//  create('ffffffff', 'ddddddd')
//
// ])
//     .then(console.log)
