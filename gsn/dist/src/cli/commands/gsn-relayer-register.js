"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Utils_1 = require("../../common/Utils");
const CommandsLogic_1 = __importDefault(require("../CommandsLogic"));
const utils_1 = require("../utils");
const web3_utils_1 = require("web3-utils");
const CommandsWinstonLogger_1 = require("../CommandsWinstonLogger");
const commander = utils_1.gsnCommander(['n', 'f', 'm', 'g'])
    .option('--relayUrl <url>', 'url to advertise the relayer', 'http://localhost:8090')
    .option('--stake <stake>', 'amount to stake for the relayer, in ETH', '1')
    .option('--unstakeDelay <delay>', 'blocks to wait between unregistering and withdrawing the stake', '1000')
    .option('--funds <funds>', 'amount to transfer to the relayer to pay for relayed transactions, in ETH', '2')
    .parse(process.argv);
(async () => {
    var _a;
    const host = utils_1.getNetworkUrl(commander.network);
    const mnemonic = utils_1.getMnemonic(commander.mnemonic);
    const logger = CommandsWinstonLogger_1.createCommandsLogger(commander.loglevel);
    const logic = await new CommandsLogic_1.default(host, logger, {}, mnemonic).init();
    const registerOptions = {
        from: (_a = commander.from) !== null && _a !== void 0 ? _a : await logic.findWealthyAccount(),
        stake: Utils_1.ether(commander.stake),
        funds: Utils_1.ether(commander.funds),
        gasPrice: web3_utils_1.toWei(commander.gasPrice, 'gwei'),
        relayUrl: commander.relayUrl,
        unstakeDelay: commander.unstakeDelay
    };
    if (registerOptions.from == null) {
        console.error('Failed to find a wealthy "from" address');
        process.exit(1);
    }
    const result = await logic.registerRelay(registerOptions);
    if (result.success) {
        console.log('Relay registered successfully! Transactions:\n', result.transactions);
        process.exit(0);
    }
    else {
        console.error('Failed to register relay:', result.error);
        process.exit(1);
    }
})().catch(reason => {
    console.error(reason);
    process.exit(1);
});
//# sourceMappingURL=gsn-relayer-register.js.map