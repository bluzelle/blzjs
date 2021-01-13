import {bluzelle, API} from 'bluzelle'
import {partial} from 'lodash'
import repl from 'repl'
import {GasInfo} from "bluzelle/lib/types/GasInfo";
import {Some} from 'monet'

export default {}


const getCommandList = (bz: API): string[] => Some(bz)
    .map(bz => Object.getOwnPropertyNames(bz).concat(Object.getOwnPropertyNames(Object.getPrototypeOf(bz))))
    .map(fnNames => fnNames.filter(name => typeof bz[name] === 'function'))
    .join();


const main = async (bz: API) => {
    console.log('Bluzelle REPL');
    console.log('To see a list of commands or get help with a specific command type ".help [command]"')
    const replServer = repl.start({useColors: true})
    getCommandList(bz).forEach(name =>
        replServer.context[name] = async (...args) => bz[name](...args)
    )

    replServer.defineCommand('help', partial(help, bz))

    replServer.context.bz = bz;
}

function help(bz, cmd) {
    Promise.resolve()
        .then(() => this.clearBufferedCommand())
        .then(() => '')
        .then(checkForCommandList)
        .then(checkForBzCmd)
        .then(checkForGasInfo)
        .then(checkForLeaseInfo)
        .then(console.log)
        .then(() => this.displayPrompt())

    function checkForCommandList(str) {
        cmd || (str +=
                getCommandList(bz)
                    .map(name => `    ${functionToSignature(bz[name])}`)
                    .filter(string => !string.includes('API'))
                    .sort()
                    .join('\n')
        )
        return str;
    }


    function functionToSignature(fn: Function) {
        return Some(fn.toString())
            .map(str => str.split('\n')[0])
            .map(str => str.replace(/^([^\)]*\)).*/, '$1'))
            .map(str => str.replace(/^async /, ''))
            .join();
    }

    function checkForBzCmd(str) {
        cmd && bz[cmd] && (str += functionToSignature(bz[cmd]) || '')
        return str;
    }

    function checkForGasInfo(str) {
        str.includes('gas_info') && (str +=
            `\n\ngas_info: ${JSON.stringify({
                gas_price: 10,
                max_fee: 20000,
                max_gas: 20000
            } as GasInfo)
            }
`)
        return str;
    }

    function checkForLeaseInfo(str) {
        str.includes('lease_info') && (str += `\n\nlease_info: ${JSON.stringify({
            days: 2,
            hours: 0,
            minutes: 0,
            seconds: 0
        })
        }
`)
        return str;
    }

}

Some({
    mnemonic: "zone loop easily similar bacon enhance alone rely supply this recipe turkey nest jar struggle worth until essence globe during pelican until range truck",
    endpoint: "https://client.sentry.testnet.public.bluzelle.com:1317",
    uuid: Date.now().toString()

})
    .map(bluzelle)
    .map(main)


