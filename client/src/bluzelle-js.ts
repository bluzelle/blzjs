import {bluzelle as bz} from './bluzelle-node'
export const bluzelle = bz;

typeof window !== undefined && ((window as any).bluzelle = bz);
