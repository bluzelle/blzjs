import {getClient} from "./CommunicationService";
import {MsgCreateCrudValue} from "./codec/crud/tx";
import {BroadcastTxFailure, BroadcastTxSuccess, SigningStargateClient} from "@cosmjs/stargate";
import Long from 'long'
import {BroadcastTxResponse} from "@cosmjs/stargate/build/stargateclient";

const myAddress = "bluzelle1uvxd0kvd5nztaadrjsae3kc3cea6z3mtcpgxrl";

const create = (key: string, value: string): Promise<BroadcastTxResponse> => {
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


    return getClient("visit sleep poem rigid coin hour balcony bone rare ring excess document empty extra sibling decide goddess tourist kidney segment true crane subway cousin")
        .then((client: SigningStargateClient) => client.signAndBroadcast(myAddress, [message], fee))
}

create('eeeeeeee', 'ccccccccc')
    .then(console.log)
    .then(() => create('ffffffff', 'ddddddd'))
    .then(console.log)
