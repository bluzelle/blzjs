import {localChain} from "../../config"
import {dbSdk, DbSdk} from "../../../src/crud-sdk/crud-sdk";
export const DEFAULT_TIMEOUT = 800000;

export const getSdk = (): Promise<DbSdk> => {
    return dbSdk({
        mnemonic: localChain.mnemonic,
        url: localChain.endpoint,
        gasPrice: 0.002,
        maxGas: 100000
    })
}