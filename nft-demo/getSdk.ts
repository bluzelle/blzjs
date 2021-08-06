import {bluzelle, API} from "bluzelle"
import {memoize} from 'lodash'
import {passThrough, passThroughAwait} from "promise-passthrough";
import delay from "delay";




export const getUrl = (prodPort: number, devPort: number, path: string = '') =>
    `https://client.sentry.testnet.public.bluzelle.com:${prodPort}${path}`;


export const getSdk = memoize<() => Promise<API>>(() =>
    getMnemonic()
        .then(passThroughAwait(() => delay(5000)))
        .then(mnemonic =>
            bluzelle({
                mnemonic,
                endpoint: getUrl(1317, 1317),
                uuid: Date.now().toString(),
            })
        )
);

const getMnemonic = (): Promise<string> =>
    fetch(getUrl(1317, 1317,'/mint'))
        .then(x => x.arrayBuffer().then(buf => ({x, buf})))
        .then(resp => ({
            body: new Uint8Array(resp.buf),
            contentType: resp.x.headers.get('content-type') || ''
        }))
        .then(({body}) => new TextDecoder().decode(body))
        .then(x => JSON.parse(x))
        .then(x => x.mnemonic)
        .then(passThrough(mnemonic => console.log('MNEMONIC: ', mnemonic)))
