export {API} from './swarmClient/Api'
export {BluzelleConfig} from './BluzelleConfig'
export {bluzelle} from './bluzelle-node';

import {bluzelle} from './bluzelle-node'

typeof window !== undefined && ((window as any).bluzelle = bluzelle);
