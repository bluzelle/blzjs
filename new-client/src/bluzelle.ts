import {BluzelleConfig} from "./types/BluzelleConfig";
import {API} from "./API";



export const bluzelle = (config: BluzelleConfig) => new API(config);


