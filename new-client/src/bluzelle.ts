import {BluzelleConfig} from "./BluzelleConfig";
import {API} from "./API";



export const bluzelle = (config: BluzelleConfig) => new API(config);


