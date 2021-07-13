import { GasInfo } from "../types/GasInfo";
import { API } from "../API";
import { MessageResponse } from "../types/MessageResponse";
import { Message } from "../types/Message";
import { Window as KeplrWindow } from '@keplr-wallet/types';
declare global {
    interface Window extends KeplrWindow {
    }
}
interface MessageQueueItem<T> {
    message: Message<T>;
    gasInfo: GasInfo;
}
export interface CommunicationService {
    api: API;
    seq: string;
    account: string;
    accountRequested?: Promise<unknown>;
    transactionMessageQueue?: TransactionMessageQueue;
}
interface TransactionMessageQueue {
    memo: string;
    items: MessageQueueItem<unknown>[];
}
export interface WithTransactionsOptions {
    memo: string;
}
export declare const newCommunicationService: (api: API) => {
    api: API;
    seq: string;
    account: string;
};
export declare const withTransaction: <T>(service: CommunicationService, fn: () => T, { memo }: WithTransactionsOptions) => Promise<MessageResponse<T>>;
export declare const sendMessage: <T, R>(ctx: CommunicationService, message: Message<T>, gasInfo: GasInfo) => Promise<MessageResponse<R>>;
export declare const getCosmos: ((api: API) => Promise<any>) & import("lodash").MemoizedFunction;
export {};
//# sourceMappingURL=CommunicationService.d.ts.map