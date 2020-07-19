import {bluzelle} from 'bluzelle'
import {Config, createAccounts, fundAccounts} from "./utils";

const {bluzelleConfig} = require('../example-config.js')

const bz = bluzelle(bluzelleConfig)

const program = require('commander');

setTimeout(() =>
    program
        .arguments('[numAccounts] [numberOfKeys')
        .description('create and fund accounts')
        .action((numOfAccounts: string, numOfKeys: string) => start(<Config>{
            NUMBER_OF_KEYS: parseInt(numOfKeys || '1'),
            NUMBER_OF_CLIENTS: parseInt(numOfAccounts || '1')
        }))
        .parse(process.argv)
)


const start = (config: Config): Promise<any> =>
    createAccounts(bz, config)
        .then(fundAccounts(bz, config))


