import {bluzelle, API} from 'bluzelle'
import {Left, Right, Some} from "monet";
import {pad, times, uniqueId} from 'lodash'

export interface Config {
    NUMBER_OF_KEYS: number
    NUMBER_OF_CLIENTS: number
    VALUE_LENGTH: number
}


function error(message: string) {
    throw message;
}


export const verifyKeys = (config: Config) => (accounts: API[]) =>
    Promise.all(accounts.map(account =>
        Promise.all(times(config.NUMBER_OF_KEYS, n =>
            account.read(`key-${n}`)
                .then(x => x === 'x'.repeat(config.VALUE_LENGTH) || error("Key not written - invalid read"))
        ))
    ))


export const createKeys = async (config: Config, account: API): Promise<{ account: API, time: number }> => account.withTransaction(async () => {
    const start = Date.now();
    await Promise.all(times(config.NUMBER_OF_KEYS, n => account.create(`key-${n}`, 'x'.repeat(config.VALUE_LENGTH), {gas_price: 10})))
    return {account, time: Date.now() - start};
})


export const fundAccounts = (from: API, config: Config) => (accounts: API[]): Promise<any> => {
    return accounts.reduce((queueTail: Promise<any>, account) => {
            return queueTail.then(() => fundAccount(from, config, account))
        }, Promise.resolve()
    )
        .then(() => accounts)
}


const log = (message: string) => (value: any) => {console.log(message, value); return value}

const fundAccount = (from: API, config: Config, account: API): Promise<any> =>
    account.getBNT()
        .then(log('current tokens'))
        .then(amt => amt < config.NUMBER_OF_KEYS * 5)
        .then(log('needs funding'))
        .then(needsFunding => needsFunding ? from.transferTokensTo(account.address, config.NUMBER_OF_KEYS * 10, {gas_price: 10}).then(() => account) : account)

export const createAccounts = (bz: API, config: Pick<Config, 'NUMBER_OF_CLIENTS'>): Promise<API[]> => Promise.all(times(config.NUMBER_OF_CLIENTS, (n) => createAccount(bz, n)))

const createAccount = (bz: API, n: number): API =>
    Some(n)
        .map(n => pad(n.toString(), 64, '1'))
        .map(entropy => bz.generateBIP39Account(entropy))
        .map(mnemonic => bluzelle({
            mnemonic,
            endpoint: bz.url,
            uuid: Date.now().toString() + uniqueId(),
            chain_id: bz.chainId
        }))
        .map(x => x)
        .join()

