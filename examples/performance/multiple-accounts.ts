import {pad, times} from "lodash";
import {Either, Right, Some} from "monet";
import {GasInfo} from "bluzelle/lib/types/GasInfo";
import {bluzelle, API} from 'bluzelle'


const {bluzelleConfig} = require('../example-config.js')


const GAS_INFO: GasInfo = {gas_price: 10};

const bz = bluzelle(bluzelleConfig)

const program = require('commander');


let numberOfAccounts: number = 1;
let numberOfKeys: number = 1;
let valueLength: number = 1;


program
    .arguments('[numAccounts] [numOfKeys] [valLength]')
    .description('parallel performance demo')
    .action((numOfAccounts: string, numOfKeys: string, valLength: string) => {
        numOfAccounts && (numberOfAccounts = parseInt(numOfAccounts))
        numOfKeys && (numberOfKeys = parseInt(numOfKeys));
        valLength && (valueLength = parseInt(valLength))
    }).parse(process.argv);


setTimeout(async () => {
    let start: number;
        Promise.resolve()
            .then(() => createAccounts(numberOfAccounts))
            .then(fundAccounts)
            .then(accounts => Promise.all(accounts.map(deleteKeys)))
            .then(accounts => {start = Date.now(); return accounts})
            .then(accounts => Promise.all(accounts.map(createKeys)))
            .then(accountsAndTimes => ({
                totalTime: Date.now() - start,
                accountTimes: accountsAndTimes
            }))
            .then(x => x);
    }
)

const deleteKeys = (account: API) =>
    account.deleteAll({gas_price: 10})
        .then(() => account)

const createKeys = (account: API) => account.withTransaction(async () => {
    const start = Date.now();
    await Promise.all(times(numberOfKeys, n => account.create(`key-${n}`, 'x'.repeat(valueLength), {gas_price: 10})))
    return {account, time: Date.now() - start};
})

const fundAccounts = (accounts: API[]) => Promise.all(accounts.map(fundAccount))

const fundAccount = (account: API): Promise<any> => account.account()
    .then(a => a.coins[0])
    .then(coins => coins ? parseInt(coins.amount || '0') / 1e6 : 0)
    .then(amt => amt < numberOfKeys * 5)
    .then(needsFunding => needsFunding ? bz.transferTokensTo(account.address, numberOfKeys * 5, {gas_price: 10}) && account : account)


const createAccounts = (numOfAccounts: number)  => times(numOfAccounts, (n: number) =>
    Some(n)
        .map(n => pad(n.toString(), 64, '1'))
        .map(entropy => bz.generateBIP39Account(entropy))
        .map(mnemonic => bluzelle({
            mnemonic,
            endpoint: bz.url,
            uuid: Date.now().toString(),
            chain_id: bz.chainId
        }))
        .join()
)

process.on('unhandledRejection', e => console.log('ERROR: ',e))


