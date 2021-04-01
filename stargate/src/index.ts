import {MsgCreateCrudValue} from "./codec/crud/tx";
import {SigningStargateClient} from "@cosmjs/stargate";
import Long from 'long'
import {TxRaw} from "@cosmjs/stargate/build/codec/cosmos/tx/v1beta1/tx";
import {memoize} from 'lodash'
import {getClient} from "./CommunicationService";

const myAddress = "bluzelle1uvxd0kvd5nztaadrjsae3kc3cea6z3mtcpgxrl";

let seq = 28


const create = (key: string, value: string) /*Promise<BroadcastTxResponse>*/ => {
    const message = {
        typeUrl: "/bluzelle.curium.crud.MsgCreateCrudValue",
        value: {
            uuid: 'uuid',
            key: key,
            value: value,
            creator: "bluzelle1uvxd0kvd5nztaadrjsae3kc3cea6z3mtcpgxrl",
            height: new Long(0),
            lease: new Long(0)
        } as MsgCreateCrudValue,
    };
    const fee = {
        amount: [
            {
                denom: "ubnt",
                amount: "120000",
            },
        ],
        gas: "1000000",
    };


    const getChainId = memoize<(client: SigningStargateClient) =>Promise<string>>((client) => client.getChainId())


    return getClient("visit sleep poem rigid coin hour balcony bone rare ring excess document empty extra sibling decide goddess tourist kidney segment true crane subway cousin")
        .then(client => getChainId(client).then(chainId => ({client, chainId})))
        .then(ctx => ctx.client.sign(myAddress,[message], fee, 'memo', {
            accountNumber: 0,
            chainId: ctx.chainId,
            sequence: seq++
        })
            .then(txRaw => ({...ctx, txRaw}))
        )
        .then(ctx => ({
            ...ctx,
            signedTx: Uint8Array.from(TxRaw.encode(ctx.txRaw).finish())
        })
        )
        .then(ctx => ctx.client.broadcastTx(ctx.signedTx))
}

Promise.all([
    create('eeeeeeee', 'ccccccccc'),
 create('ffffffff', 'ddddddd')

])
    .then(console.log)
