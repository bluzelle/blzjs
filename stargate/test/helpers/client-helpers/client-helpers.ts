import {Daemon, DaemonAuth} from "curium-control/daemon-manager/lib/Daemon";
import {Swarm} from "curium-control/daemon-manager/lib/Swarm";
import {bluzelle} from "../../../src/bluzelle-node";
import {bluzelle as bluzelleJS} from '../../../src/bluzelle-js';
import {BluzelleConfig} from "../../../src/types/BluzelleConfig";
import {API} from "../../../src/API";
import {range} from 'lodash'
import {getSwarm, SINGLE_SENTRY_SWARM} from "testing/lib/helpers/swarmHelpers";
import {browserProxy} from "./browserProxy";
import {pythonProxy} from "./pythonProxy";
import {rubyProxy} from "./rubyProxy";
import {goProxy} from "./goProxy";
export const DEFAULT_TIMEOUT = 800000;
import axios from 'axios'
import delay from "delay";
import {javaProxy} from "./javaProxy";
import {phpProxy} from "./phpProxy";
import {remoteProxy} from "./remoteProxy";
import {cSharpProxy} from "./cSharpProxy";
import {extend} from 'lodash'
import {GasInfo} from '../../../src/types/GasInfo'
import {Some} from "monet";

// Allow self signed certificates
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

require('dotenv').config()

export type APIAndSwarm = API & {swarm?: Swarm};

const useLocalClient = (): API | undefined => {

    if (process.env.MNEMONIC && process.env.ENDPOINT) {
        return bluzelle({
            mnemonic: process.env.MNEMONIC || '',
            endpoint: process.env.ENDPOINT || '',
            uuid: Date.now().toString()
        })
    }
}


export const sentryWithClient = async (extra: Partial<BluzelleConfig> = {}): Promise<APIAndSwarm> => {

    if (useLocalClient()) {
        return Promise.resolve(useLocalClient()) as Promise<APIAndSwarm>
    }

    if(getServerToUse() === 'testnet') {
        const config: BluzelleConfig  = {
            mnemonic: "auction resemble there doll room uncle since gloom unfold service ghost beach cargo loyal govern orient book shrug heavy kit coil truly describe narrow",
            endpoint: "http://client.sentry.testnet.public.bluzelle.com:1317",
            uuid: Date.now().toString()
        }
        return bluzelle(config)
    }

    if(getBluzelleClient() === 'remote') {
        const config: BluzelleConfig  = {
            mnemonic: "auction resemble there doll room uncle since gloom unfold service ghost beach cargo loyal govern orient book shrug heavy kit coil truly describe narrow",
            endpoint: "http://client.sentry.testnet.public.bluzelle.com:1317",
            uuid: Date.now().toString()
        }
        return await remoteProxy(bluzelle(config))
    } else {
        const swarm: Swarm = await getSwarm([SINGLE_SENTRY_SWARM]);
        return extend(await getClient(swarm.getSentries()[0], swarm.getValidators()[0], extra), {swarm: swarm});
    }
};

export const getClient = async (sentry: Daemon, validator: Daemon, extra: Partial<BluzelleConfig> = {}): Promise<API> => {
    const auth: DaemonAuth = await validator.getAuth();

    const endpoint = ['ruby', 'python', 'go', 'java', 'php', 'c-sharp'].includes(getBluzelleClient() as string) ? `http://${await sentry.getIPAddress()}:1317` :  `https://localhost:${sentry.getAdhocPort()}`;

    const vuserBz = bluzelle({
        mnemonic: auth.mnemonic,
        endpoint: endpoint,
        uuid: 'uuid'
    });

    const bluzelleConfig: BluzelleConfig = <BluzelleConfig>{
        mnemonic: vuserBz.generateBIP39Account(),
        endpoint: endpoint,
        uuid: 'uuid',
        ...extra
    };

    let bz: API = bluzelle({...bluzelleConfig, endpoint: `https://localhost:${sentry.getAdhocPort()}`});

    await vuserBz.transferTokensTo(bz.address, 1000000, defaultGasParams());

    getBluzelleClient() === 'c-sharp' && (bz = await cSharpProxy(bz, bluzelleConfig));
    getBluzelleClient() === 'php' && (bz = await phpProxy(bz, bluzelleConfig));
    getBluzelleClient() === 'java' && (bz = await javaProxy(bz, bluzelleConfig));
    getBluzelleClient() === 'python' && (bz = await pythonProxy(bz, bluzelleConfig));
    getBluzelleClient() === 'ruby' && (bz = await rubyProxy(bz, bluzelleConfig));
    getBluzelleClient() === 'go' && (bz = await goProxy(bz, bluzelleConfig));
    getBluzelleClient() === 'browser' && (bz = await browserProxy(bz, bluzelleConfig));
    getBluzelleClient() === 'js' && (bz = await bluzelleJS(bluzelleConfig));
    getBluzelleClient() === 'node' && (bz = bz);
    return bz;
};

export const defaultGasParams = (gasInfo: GasInfo = {}): GasInfo => ({gas_price: 0.004, max_gas: 100000000, ...gasInfo})

export const getBluzelleClient = (): string | undefined =>
    process.argv.find(it => it.includes('--bluzelle-client='))?.replace('--bluzelle-client=', '') || 'node';


export const getServerToUse = (): string | undefined =>
    process.argv.find(it => it.includes('--server'))?.replace('--server=', '')

export const createKeys = async (bz: API, count: number): Promise<{keys: string[], values: string[]}> => {
    const keys = range(0, count).map(n => `key-${n}`);
    const values = range(0, count).map(n => `value-${n}`);
    await bz.withTransaction(() => keys.map((key, idx) => bz.create(key, values[idx], defaultGasParams())));
    return {keys, values};
};

export const waitForProxyUp = (port: number) => {

    return new Promise<void>(resolve => {
        (async function loop() {
            axios.get(`https://localhost:${port}`)
                .then(() => {
                    console.log('Proxy up');
                    resolve();
                })
                .catch((e) => {
                    if(e.code) {
                        console.log('Waiting for proxy up', port);
                        delay(500).then(loop);
                    } else {
                        console.log('Proxy up');
                        resolve();
                    }
                })
        }())

    })
}

export const serializeRequests = (() => {
    let queue: Promise<any> = Promise.resolve();

    return (fn: () => Promise<any>): Promise<any> => {
        return new Promise((resolve, reject) => {
            queue = queue.then( () => fn().then(resolve).catch(reject));
        })
    }
})()

export const newBzClient = (bz: API): Promise<API> =>
    Some(bz.generateBIP39Account())
        .map(mnemonic => bluzelle({
            mnemonic,
            endpoint: bz.url,
            uuid: bz.uuid
        }))
        .map(async (newBz: API) => {
            await bz.transferTokensTo(newBz.address, 1000, defaultGasParams());
            return newBz;
        })
        .join()
