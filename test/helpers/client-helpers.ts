import {BluzelleConfig, GasInfo, bluzelle, API, } from "../../client";
import {Swarm} from 'daemon-manager/lib/Swarm';
import {Daemon, DaemonAuth} from 'daemon-manager/lib/Daemon';
import {getSwarm, SINGLE_SENTRY_SWARM} from '@bluzelle/testing/lib/helpers/swarmHelpers';
import {extend, pad, range, times, uniqueId} from 'lodash';
import {Some} from 'monet';
import {expect} from "chai";

export class Config {
    NUMBER_OF_KEYS: number = 10
    NUMBER_OF_CLIENTS: number = 3
    VALUE_LENGTH: number = 100
}

export const defaultGasParams = (gasInfo: GasInfo = {}): GasInfo => ({gas_price: 0.004, max_gas: 100000000, ...gasInfo})
export type APIAndSwarm = API & { swarm?: Swarm };
export const DEFAULT_TIMEOUT = 800000;

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

export const getClient = async (sentry: Daemon, validator: Daemon, extra: Partial<BluzelleConfig> = {}): Promise<API> => {
    const auth: DaemonAuth = await validator.getAuth();

    const endpoint = `https://localhost:${sentry.getAdhocPort()}`;

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

    const bz: API = bluzelle({...bluzelleConfig, endpoint: `https://localhost:${sentry.getAdhocPort()}`});

    await vuserBz.transferTokensTo(bz.address, 1000000, defaultGasParams());

    return bz;
};

export const sentryWithClient = async (extra: Partial<BluzelleConfig> = {}): Promise<APIAndSwarm> =>
    getSwarm([SINGLE_SENTRY_SWARM])
        .then(swarm =>
            getClient(swarm.getSentries()[0], swarm.getValidators()[0], extra)
                .then(client => extend(client, {swarm}))
        );

export const createAccounts = (bz: APIAndSwarm, numOfAccounts: number): Promise<API[]> => Promise.all(times(numOfAccounts, (n) => createAccount(bz, n)))

export const createAccount = (bz: APIAndSwarm, n: number): API =>
    Some(n)
        .map(n => pad(n.toString(), 64, '1'))
        .map(entropy => bz.generateBIP39Account(entropy))
        .map(mnemonic => bluzelle({
            mnemonic,
            endpoint: bz.url,
            uuid: Date.now().toString() + uniqueId()
        }))
        .join()

export const fundAccount = (from: API, config: Config, account: API): Promise<any> => account.getBNT()
    .then(amt => amt < config.NUMBER_OF_KEYS)
    .then(needsFunding => needsFunding ? from.transferTokensTo(account.address, config.NUMBER_OF_KEYS * 30000, defaultGasParams()).then(() => account) : account)

export const fundAccounts = (from: API, config: Config) => (accounts: API[]): Promise<any> =>
    accounts.reduce((queueTail: Promise<any>, account) => {
            return queueTail.then(() => fundAccount(from, config, account))
        }, Promise.resolve()
    )
        .then(() => accounts)

export const createKeys = async (bz: APIAndSwarm, count: number): Promise<{ keys: string[], values: string[] }> => {
    const keys = range(0, count).map(n => `key${n}`);
    const values = range(0, count).map(() => `value`);
    await bz.withTransaction(() => keys.map((key, idx) => bz.create(key, values[idx], defaultGasParams())));
    return {keys, values};
};

export const createMultiClientKeys = (config: Config) => async (account: API): Promise<{account: API, time: number}> => {
    const start = Date.now()
    await account.withTransaction(() => times(config.NUMBER_OF_KEYS, n => account.create(`key-${n}`, 'x'.repeat(config.VALUE_LENGTH), defaultGasParams())));
    return {account, time: Date.now() - start}
}

export const verifyKeys = (config: Config) => (accounts: API[]) =>
    Promise.all(accounts.map(account =>
        Promise.all(times(config.NUMBER_OF_KEYS, n =>
            account.read(`key-${n}`)
                .then(x => expect(x).to.equal('x'.repeat(config.VALUE_LENGTH)))
        ))
    ))

export const createNewBzClient = (bz: APIAndSwarm): Promise<APIAndSwarm> =>
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