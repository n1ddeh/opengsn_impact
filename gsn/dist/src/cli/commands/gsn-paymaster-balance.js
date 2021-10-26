"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const web3_1 = __importDefault(require("web3"));
const CommandsLogic_1 = __importDefault(require("../CommandsLogic"));
const utils_1 = require("../utils");
const CommandsWinstonLogger_1 = require("../CommandsWinstonLogger");
const commander = utils_1.gsnCommander(['h', 'n', 'm'])
    .option('--paymaster <address>', 'address of the paymaster contract')
    .parse(process.argv);
(async () => {
    const network = commander.network;
    const nodeURL = utils_1.getNetworkUrl(network);
    const hub = utils_1.getRelayHubAddress(commander.hub);
    const paymaster = utils_1.getPaymasterAddress(commander.paymaster);
    if (hub == null || paymaster == null) {
        throw new Error(`Contracts not found: hub: ${hub} paymaster: ${paymaster} `);
    }
    const logger = CommandsWinstonLogger_1.createCommandsLogger(commander.loglevel);
    const mnemonic = utils_1.getMnemonic(commander.mnemonic);
    const logic = new CommandsLogic_1.default(nodeURL, logger, { relayHubAddress: hub }, mnemonic);
    const balance = await logic.getPaymasterBalance(paymaster);
    console.log(`Account ${paymaster} has a GSN balance of ${web3_1.default.utils.fromWei(balance)} ETH`);
})().catch(reason => {
    console.error(reason);
    process.exit(1);
});
//# sourceMappingURL=gsn-paymaster-balance.js.map