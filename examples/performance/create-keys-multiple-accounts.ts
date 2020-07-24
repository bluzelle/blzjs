import {bluzelle} from 'bluzelle'
import {Config, createAccounts, createKeys} from "./utils";
import {times} from 'lodash'

const {bluzelleConfig} = require('../example-config.js')

const bz = bluzelle(bluzelleConfig)

const program = require('commander');

setTimeout(() =>
    program
        .arguments('[numAccounts] [numberOfKeys] [lengthOfValues')
        .description('create and fund accounts')
        .action((numOfAccounts: string, numOfKeys: string, lengthOfValues: string) => start(<Config>{
            NUMBER_OF_KEYS: parseInt(numOfKeys || '1'),
            NUMBER_OF_CLIENTS: parseInt(numOfAccounts || '1'),
            VALUE_LENGTH: parseInt(lengthOfValues || '1')
        }))
        .parse(process.argv)
)


const start = async (config: Config): Promise<any> => {
    const start = Date.now();

    await createAccounts(bz, config)
        .then(accounts => Promise.all(accounts.map(account =>
            createKeys(config, account)
        )))
        .then(results => results.forEach(result => console.log(result.time, result.txhash)));


    const totalTime = ((Date.now() - start) / 1000)
    console.log('Clients: ', config.NUMBER_OF_CLIENTS);
    console.log('Keys per client:', config.NUMBER_OF_KEYS);
    console.log('Value length:', config.VALUE_LENGTH)
    console.log('Total keys written', config.NUMBER_OF_CLIENTS * config.NUMBER_OF_KEYS)
    console.log('Total time:', totalTime.toFixed(2));
    console.log('Writes per second:', ((config.NUMBER_OF_CLIENTS * config.NUMBER_OF_KEYS) / totalTime).toFixed(2))
}


