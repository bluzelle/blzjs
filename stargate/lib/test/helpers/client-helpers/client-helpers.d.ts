import { Daemon } from "curium-control/daemon-manager/lib/Daemon";
import { Swarm } from "curium-control/daemon-manager/lib/Swarm";
import { BluzelleConfig } from "../../../src/types/BluzelleConfig";
import { API } from "../../../src/API";
export declare const DEFAULT_TIMEOUT = 800000;
import { GasInfo } from '../../../src/types/GasInfo';
export declare type APIAndSwarm = API & {
    swarm?: Swarm;
};
export declare const sentryWithClient: (extra?: Partial<BluzelleConfig>) => Promise<APIAndSwarm>;
export declare const getClient: (sentry: Daemon, validator: Daemon, extra?: Partial<BluzelleConfig>) => Promise<API>;
export declare const defaultGasParams: (gasInfo?: GasInfo) => GasInfo;
export declare const getBluzelleClient: () => string | undefined;
export declare const getServerToUse: () => string | undefined;
export declare const createKeys: (bz: API, count: number) => Promise<{
    keys: string[];
    values: string[];
}>;
export declare const waitForProxyUp: (port: number) => Promise<void>;
export declare const serializeRequests: (fn: () => Promise<any>) => Promise<any>;
export declare const newBzClient: (bz: API) => Promise<API>;
//# sourceMappingURL=client-helpers.d.ts.map