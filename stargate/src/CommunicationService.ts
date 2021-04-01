import {DirectSecp256k1HdWallet, GeneratedType, Registry} from "@cosmjs/proto-signing";
import { defaultRegistryTypes, SigningStargateClient } from "@cosmjs/stargate";
import {MsgCreateCrudValue} from './codec/crud/tx'

const myRegistry = new Registry([
    ...defaultRegistryTypes,
        ["/bluzelle.curium.crud.MsgCreateCrudValue", MsgCreateCrudValue]
] as Iterable<[string, GeneratedType]>);
const mnemonic =
    "visit sleep poem rigid coin hour balcony bone rare ring excess document empty extra sibling decide goddess tourist kidney segment true crane subway cousin";

// Inside an async function...
const getSigner = () => DirectSecp256k1HdWallet.fromMnemonic(
    mnemonic,
    undefined,
    "bluzelle",
);

export const getClient = () =>
    getSigner()
        .then(signer => SigningStargateClient.connectWithSigner(
            "http://localhost:26657",
            signer,
            {
                registry: myRegistry,
            },
        ));


