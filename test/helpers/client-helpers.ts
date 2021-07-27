import {BluzelleConfig} from "../../client/lib/types/BluzelleConfig";
import {Swarm} from '@bluzelle/testing/node_modules/curium-control/daemon-manager/lib/Swarm';
import {Daemon, DaemonAuth} from '@bluzelle/testing/node_modules/curium-control/daemon-manager/lib/Daemon';
import {getSwarm, SINGLE_SENTRY_SWARM} from '@bluzelle/testing/lib/helpers/swarmHelpers';
import {GasInfo} from '../../client/lib/types/GasInfo';
import {API} from "../../client/lib/API";
import {bluzelle} from "../../client/lib/bluzelle-node";
import {extend, range} from 'lodash';


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

export const createKeys = async (bz: APIAndSwarm, count: number): Promise<{ keys: string[], values: string[] }> => {
    const keys = range(0, count).map(n => `key${n}`);
    const values = range(0, count).map(n => `value${n}`);
    await bz.withTransaction(() => keys.map((key, idx) => bz.create(key, values[idx], defaultGasParams())));
    return {keys, values};
};