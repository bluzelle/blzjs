import {DirectSecp256k1HdWallet, GeneratedType, Registry} from "@cosmjs/proto-signing";
import { defaultRegistryTypes, SigningStargateClient } from "@cosmjs/stargate";
import {MsgCreateCrudValue} from './codec/crud/tx'
import {memoize} from 'lodash'

const myRegistry = new Registry([
    ...defaultRegistryTypes,
        ["/bluzelle.curium.crud.MsgCreateCrudValue", MsgCreateCrudValue]
] as Iterable<[string, GeneratedType]>);

// Inside an async function...
const getSigner = (mnemonic: string) => DirectSecp256k1HdWallet.fromMnemonic(
    mnemonic,
    undefined,
    "bluzelle",
);


export const getClient = memoize((mnemonic: string) =>
    getSigner(mnemonic)
        .then(signer => SigningStargateClient.connectWithSigner(
            "http://localhost:26657",
            signer,
            {
                registry: myRegistry,
            }
        )));


