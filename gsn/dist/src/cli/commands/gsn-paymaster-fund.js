"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Utils_1 = require("../../common/Utils");
const CommandsLogic_1 = __importDefault(require("../CommandsLogic"));
const utils_1 = require("../utils");
const CommandsWinstonLogger_1 = require("../CommandsWinstonLogger");
const commander = utils_1.gsnCommander(['n', 'f', 'h', 'm'])
    .option('--paymaster <address>', 'address of the paymaster contract (defaults to address from build/gsn/Paymaster.json if exists')
    .option('--amount <amount>', 'amount of funds to deposit for the paymaster contract, in wei (defaults to 1 Ether)')
    .parse(process.argv);
(async () => {
    var _a, _b;
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
    const from = (_a = commander.from) !== null && _a !== void 0 ? _a : await logic.findWealthyAccount();
    const amount = (_b = commander.amount) !== null && _b !== void 0 ? _b : Utils_1.ether('1');
    const balance = await logic.fundPaymaster(from, paymaster, amount);
    console.log(`Paymaster ${paymaster} balance is now ${balance.toString()} wei`);
})().catch(reason => {
    console.error(reason);
    process.exit(1);
});
//# sourceMappingURL=gsn-paymaster-fund.js.map