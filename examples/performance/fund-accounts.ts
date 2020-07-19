import {bluzelle, BluzelleConfig} from 'bluzelle'
import {GasInfo} from "bluzelle/lib/types/GasInfo";
import {Config, createAccounts, fundAccounts} from "./utils";

const {bluzelleConfig} = require('../example-config.js')

const GAS_INFO: GasInfo = {gas_price: 10};

const bz = bluzelle(bluzelleConfig)

const program = require('commander');

setTimeout(() =>
    program
        .arguments('[numAccounts]')
        .description('create and fund accounts')
        .action((numOfAccounts: string) => start(<Config>{NUMBER_OF_CLIENTS: parseInt(numOfAccounts || '1')}))
        .parse(process.argv)
)


const start = (config: Config): Promise<any> =>
    createAccounts(bz, config)
        .then(fundAccounts(bz, config))


