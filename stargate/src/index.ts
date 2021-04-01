import {getClient} from "./CommunicationService";
import {MsgCreateCrudValue} from "./codec/crud/tx";
import {SigningStargateClient} from "@cosmjs/stargate";
import Long from 'long'

const myAddress = "bluzelle1uvxd0kvd5nztaadrjsae3kc3cea6z3mtcpgxrl";

const message = {
    typeUrl: "/bluzelle.curium.crud.MsgCreateCrudValue",
    value: {
        uuid: 'uuid',
        key: 'foo2',
        value: "bargggggggg",
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



getClient()
    .then((client:SigningStargateClient) => client.signAndBroadcast(myAddress, [message], fee))
    .then(console.log)

