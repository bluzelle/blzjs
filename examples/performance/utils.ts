import {bluzelle, API} from 'bluzelle'
import {Some} from "monet";
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

const createKeys = (config: Config) => (account: API): {account: API, time: number} => account.withTransaction(async () => {
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

const fundAccount = (from: API, config: Config, account: API): Promise<any> => account.account()
    .then(a => {console.log('Account: ', a.address); return a})
    .then(a => a.coins[0])
    .then(coins => {console.log('current coins', coins); return coins})
    .then(coins => coins ? parseInt(coins.amount || '0') / 1e6 : 0)
    .then(amt => amt < config.NUMBER_OF_KEYS)
    .then(needsFunding => {needsFunding && console.log('adding tokens'); return needsFunding})
    .then(needsFunding => needsFunding ? from.transferTokensTo(account.address, config.NUMBER_OF_KEYS * 5, {gas_price: 10}).then(() => account) : account)


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

