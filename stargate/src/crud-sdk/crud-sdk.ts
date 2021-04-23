import {SDK, sdk, SDKOptions} from "../client-lib/rpc";
import {QueryClientImpl} from "../codec/crud/query";
import {MsgClientImpl} from "../codec/crud/tx";
import * as MsgTypes from "../codec/crud/tx";

export type DbSdk = SDK<QueryClientImpl, MsgClientImpl>

export const dbSdk = (options: SDKOptions) => sdk<QueryClientImpl, MsgClientImpl>(options, QueryClientImpl, MsgClientImpl, MsgTypes)