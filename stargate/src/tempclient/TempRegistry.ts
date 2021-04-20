import {GeneratedType, Registry} from "@cosmjs/proto-signing";
import {defaultRegistryTypes} from "@cosmjs/stargate";

const registryTypes: [string, GeneratedType][] = [...defaultRegistryTypes]
export let myRegistry = new Registry(registryTypes)
export const addMessageType = (typeUrl: string, type: GeneratedType) => {
    registryTypes.push([typeUrl, type]);
    myRegistry = new Registry(registryTypes)
}