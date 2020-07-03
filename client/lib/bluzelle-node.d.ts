export { API } from './swarmClient/Api';
export { BluzelleConfig } from './BluzelleConfig';
import { API } from './swarmClient/Api';
import { BluzelleConfig } from "./BluzelleConfig";
export declare const bluzelle: {
    (config: BluzelleConfig): Promise<API>;
    mnemonicToAddress: (mnemonic: string) => Promise<string>;
};
//# sourceMappingURL=bluzelle-node.d.ts.map