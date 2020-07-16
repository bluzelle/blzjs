import {bluzelle} from 'bluzelle'
import {times} from 'lodash'
import {GasInfo} from "bluzelle/lib/types/GasInfo";

const {bluzelleConfig} = require('../example-config.js')


const GAS_INFO: GasInfo = {gas_price: 10};

const bz = bluzelle(bluzelleConfig)

const program = require('commander');

let numberOfKeys: number = 1;
let valueLength: number = 1;

program
    .arguments('[numOfKeys] [valLength]')
    .description('performance demo')
    .option('-t, --transaction-only', 'Only run transactional messages')
    .option('-q, --quiet', 'Do not print each transaction individually')
    .action((numOfKeys: string, valLength: string) => {
        numOfKeys && (numberOfKeys = parseInt(numOfKeys));
        valLength && (valueLength = parseInt(valLength))
    }).parse(process.argv);



const withTime = (label: string, fn: () => Promise<any>): Promise<void> => {
    console.log('start:', label)
    const start = Date.now();
    return fn()
        .then(() => console.log('end:  ', label, Date.now() - start, '\n\n'))
}



const error = (e: any) => console.log('ERROR:', e);

const createWithTransaction = () => withTime(`transactional create ${numberOfKeys} keys with ${valueLength} length values`, () =>
    bz.withTransaction(() => Promise.all(
        times(numberOfKeys, (n) =>
            bz.create(`key-transactional-${n}`, '#'.repeat(valueLength), GAS_INFO)
                .then(res => program.quiet || console.log(`key-${n} created  (${res.txhash})`))
                .catch(error)
        )
    ))
)

const createWithoutTransaction = () => withTime(`non-transactional create ${numberOfKeys} keys with ${valueLength} length values`, () =>
    Promise.all(
        times(numberOfKeys, (n) =>
            bz.create(`key-non-transactional-${n}`, '#'.repeat(valueLength), GAS_INFO)
                .then(res => program.quiet || console.log(`key-${n} created (${res.txhash})`))
                .catch(error)
        )
    )
)

const txReadWithoutTransaction = () => withTime(`read ${numberOfKeys} keys without transaction`, () =>
    Promise.all(
        times(numberOfKeys, (n) =>
            bz.txRead(`key-non-transactional-${n}`, GAS_INFO)
                .then(res => program.quiet || console.log(`key-${n} read`))
                .catch(error)
        )
    )
)

const txReadWithTransaction = () => withTime(`read ${numberOfKeys} keys with transaction`, () =>
    bz.withTransaction(() => Promise.all(
        times(numberOfKeys, (n) =>
            bz.txRead(`key-transactional-${n}`, GAS_INFO)
                .then(res => program.quiet || console.log(`key-${n} read`))
                .catch(error)
        )
    ))
)


Promise.resolve()
    .then(() => program.transactionOnly ? undefined : createWithoutTransaction())
    .then(createWithTransaction)
    .then(() => program.transactionOnly ? undefined : txReadWithoutTransaction())
    .then(txReadWithTransaction)
