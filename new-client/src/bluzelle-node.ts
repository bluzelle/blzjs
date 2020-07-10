import {BluzelleConfig} from "./types/BluzelleConfig";
import {API} from "./API";

export {API} from './API';
export {BluzelleConfig} from './types/BluzelleConfig'



export const bluzelle = (config: BluzelleConfig) => new API(config);


