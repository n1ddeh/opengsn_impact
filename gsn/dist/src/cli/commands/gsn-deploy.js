"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = __importDefault(require("commander"));
const CommandsLogic_1 = __importDefault(require("../CommandsLogic"));
const utils_1 = require("../utils");
const Environments_1 = require("../../common/Environments");
const web3_utils_1 = require("web3-utils");
const CommandsWinstonLogger_1 = require("../CommandsWinstonLogger");
utils_1.gsnCommander(['n', 'f', 'm', 'g'])
    .option('-w, --workdir <directory>', 'relative work directory (defaults to build/gsn/)', 'build/gsn')
    .option('--forwarder <address>', 'address of forwarder deployed to the current network (optional; deploys new one by default)')
    .option('--stakeManager <address>', 'stakeManager')
    .option('--relayHub <address>', 'relayHub')
    .option('--penalizer <address>', 'penalizer')
    .option('--registry <address>', 'versionRegistry')
    .option('--registryHubId <string>', 'save the address of the relayHub to the registry, with this hub-id')
    .option('--yes, --skipConfirmation', 'skip con')
    .option('-c, --config <mnemonic>', 'config JSON file to change the configuration of the RelayHub being deployed (optional)')
    .parse(process.argv);
(async () => {
    var _a, _b, _c;
    const network = commander_1.default.network;
    const nodeURL = utils_1.getNetworkUrl(network);
    const logger = CommandsWinstonLogger_1.createCommandsLogger(commander_1.default.loglevel);
    const mnemonic = utils_1.getMnemonic(commander_1.default.mnemonic);
    const relayHubConfiguration = (_a = utils_1.getRelayHubConfiguration(commander_1.default.config)) !== null && _a !== void 0 ? _a : Environments_1.defaultEnvironment.relayHubConfiguration;
    const logic = new CommandsLogic_1.default(nodeURL, logger, {}, mnemonic);
    const from = (_b = commander_1.default.from) !== null && _b !== void 0 ? _b : await logic.findWealthyAccount();
    async function getGasPrice() {
        const gasPrice = await web3.eth.getGasPrice();
        console.log(`Using network gas price of ${gasPrice}`);
        return gasPrice;
    }
    const gasPrice = (_c = web3_utils_1.toWei(commander_1.default.gasPrice, 'gwei').toString()) !== null && _c !== void 0 ? _c : await getGasPrice();
    const deploymentResult = await logic.deployGsnContracts({
        from,
        gasPrice,
        relayHubConfiguration,
        deployPaymaster: true,
        verbose: true,
        skipConfirmation: commander_1.default.skipConfirmation,
        forwarderAddress: commander_1.default.forwarder,
        stakeManagerAddress: commander_1.default.stakeManager,
        relayHubAddress: commander_1.default.relayHub,
        penalizerAddress: commander_1.default.penalizer,
        registryAddress: commander_1.default.registry,
        registryHubId: commander_1.default.registryHubId
    });
    const paymasterName = 'Default';
    utils_1.showDeployment(deploymentResult, `Deployed GSN to network: ${network}`, paymasterName);
    utils_1.saveDeployment(deploymentResult, commander_1.default.workdir);
    process.exit(0);
})().catch(reason => {
    console.error(reason);
    process.exit(1);
});
//# sourceMappingURL=gsn-deploy.js.map