"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const web3_1 = __importDefault(require("web3"));
const ContractInteractor_1 = __importDefault(require("../../common/ContractInteractor"));
const HttpClient_1 = __importDefault(require("../../relayclient/HttpClient"));
const HttpWrapper_1 = __importDefault(require("../../relayclient/HttpWrapper"));
const utils_1 = require("../utils");
const StatusLogic_1 = __importDefault(require("../StatusLogic"));
const CommandsWinstonLogger_1 = require("../CommandsWinstonLogger");
const commander = utils_1.gsnCommander(['n', 'h'])
    .parse(process.argv);
(async () => {
    const host = utils_1.getNetworkUrl(commander.network);
    const relayHubAddress = utils_1.getRelayHubAddress(commander.hub);
    if (relayHubAddress == null) {
        console.error('Please specify RelayHub address');
        process.exit(1);
    }
    const statusConfig = {
        blockHistoryCount: 6000,
        getAddressTimeout: 1000,
        relayHubAddress
    };
    const deployment = { relayHubAddress };
    const logger = CommandsWinstonLogger_1.createCommandsLogger(commander.loglevel);
    const provider = new web3_1.default.providers.HttpProvider(host);
    const contractInteractor = new ContractInteractor_1.default({ provider, logger, deployment });
    await contractInteractor.init();
    const httpClient = new HttpClient_1.default(new HttpWrapper_1.default({ timeout: statusConfig.getAddressTimeout }), logger);
    const statusLogic = new StatusLogic_1.default(contractInteractor, httpClient, statusConfig);
    const statistics = await statusLogic.gatherStatistics();
    console.log(`Total stakes by all relays: ${web3_1.default.utils.fromWei(statistics.totalStakesByRelays)} ETH`);
    console.log(`Hub address: ${relayHubAddress}`);
    console.log('\n# Relays:');
    statistics.relayRegisteredEvents.forEach(registeredEvent => {
        var _a, _b;
        const res = [];
        res.push(registeredEvent.relayManager);
        res.push(registeredEvent.relayUrl);
        res.push(`\tfee: ${registeredEvent.baseRelayFee} wei + ${registeredEvent.pctRelayFee}%`);
        const managerBalance = statistics.balances.get(registeredEvent.relayManager);
        if (managerBalance == null) {
            res.push('\tbalance: N/A');
        }
        else {
            res.push(`\tbalance: ${web3_1.default.utils.fromWei(managerBalance)} ETH`);
        }
        const pingResult = statistics.relayPings.get(registeredEvent.relayUrl);
        const status = (pingResult === null || pingResult === void 0 ? void 0 : pingResult.pingResponse) != null ? pingResult.pingResponse.ready.toString() : (_b = (_a = pingResult === null || pingResult === void 0 ? void 0 : pingResult.error) === null || _a === void 0 ? void 0 : _a.toString()) !== null && _b !== void 0 ? _b : 'unknown';
        res.push(`\tstatus: ${status}`);
        console.log('- ' + res.join(' '));
    });
    /*
      console.log('\n# Owners:')
      Object.keys(owners).forEach(k => {
        const ethBalance = web3.eth.getBalance(k)
        const relayBalance = r.methods.balanceOf(k).call()
        Promise.all([ethBalance, relayBalance])
          .then(async () => {
            // @ts-ignore
            console.log('-', owners[k], ':', k, 'on-hub:', (await relayBalance) / 1e18, '\tbal', (await ethBalance) / 1e18)
          })
          .catch(reason => {
            console.error(reason)
          })
      })
    */
})().catch(reason => {
    console.error(reason);
    process.exit(1);
});
//# sourceMappingURL=gsn-status.js.map