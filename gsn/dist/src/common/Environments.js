"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultRelayHubConfiguration = {
    gasOverhead: 35965,
    postOverhead: 13950,
    gasReserve: 100000,
    maxWorkerCount: 10,
    minimumStake: 1e18.toString(),
    minimumUnstakeDelay: 1000,
    maximumRecipientDeposit: 2e18.toString()
};
exports.environments = {
    istanbul: {
        chainId: 1,
        relayHubConfiguration: exports.defaultRelayHubConfiguration,
        mintxgascost: 21000
    },
    constantinople: {
        chainId: 1,
        relayHubConfiguration: exports.defaultRelayHubConfiguration,
        mintxgascost: 21000
    },
    ganacheLocal: {
        chainId: 1337,
        relayHubConfiguration: exports.defaultRelayHubConfiguration,
        mintxgascost: 21000
    }
};
exports.defaultEnvironment = exports.environments.ganacheLocal;
//# sourceMappingURL=Environments.js.map