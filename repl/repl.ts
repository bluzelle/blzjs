import {bluzelle, API} from 'bluzelle'
import {partial} from 'lodash'
import repl from 'repl'
import {GasInfo} from "bluzelle/lib/GasInfo";

export default {}

const main = async (bz: API) => {
    console.log('Bluzelle REPL');
    console.log('To see a list of commands or get help with a specific command type ".help [command]"')
    const replServer = repl.start({useColors: true})
    Object.getOwnPropertyNames(Object.getPrototypeOf(bz)).forEach(name => {
        replServer.context[name] = async (...args) => bz[name](...args)
    })

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
                Object.getOwnPropertyNames(Object.getPrototypeOf(bz))
                    .map(name => `    ${functionToSignature(bz[name])}`)
                    .filter(string => !string.includes('API'))
                    .sort()
                    .join('\n')
        )
        return str;
    }


    function functionToSignature(fn: Function) {
        return fn.toString().split('\n')[0].replace(/^([^\)]*\)).*/, '$1')
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


bluzelle({
    mnemonic: "cradle labor rural kiwi slice very barrel oven afraid idea mistake mouse garden bless miss next collect notice dove cook replace scale gym tennis",
    endpoint: "http://client.sentry.testnet.public.bluzelle.com:1317",
    chain_id: 'bluzelleTestPublic-1',
    uuid: Date.now().toString()
}).then(main);


