"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addRegistryType = exports.myRegistry = void 0;
const proto_signing_1 = require("@cosmjs/proto-signing");
const stargate_1 = require("@cosmjs/stargate");
const registryTypes = [...stargate_1.defaultRegistryTypes];
exports.myRegistry = new proto_signing_1.Registry(registryTypes);
const addRegistryType = (typeUrl, type) => {
    registryTypes.push([typeUrl, type]);
    exports.myRegistry = new proto_signing_1.Registry(registryTypes);
};
exports.addRegistryType = addRegistryType;
//# sourceMappingURL=Registry.js.map