"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ContractInteractor_1 = require("../common/ContractInteractor");
class StatusLogic {
    constructor(contractInteractor, httpClient, config) {
        this.contractInteractor = contractInteractor;
        this.httpClient = httpClient;
        this.config = config;
    }
    async gatherStatistics() {
        const curBlockNumber = await this.contractInteractor.getBlockNumber();
        const fromBlock = Math.max(1, curBlockNumber - this.config.blockHistoryCount);
        const r = await this.contractInteractor._createRelayHub(this.config.relayHubAddress);
        const stakeManager = await r.stakeManager();
        const totalStakesByRelays = await this.contractInteractor.getBalance(stakeManager);
        const relayRegisteredEventsData = await this.contractInteractor.getPastEventsForHub([], { fromBlock }, [ContractInteractor_1.RelayServerRegistered]);
        const relayRegisteredEvents = relayRegisteredEventsData.map(e => e.returnValues);
        const relayPings = new Map();
        const balances = new Map();
        for (const registerEvent of relayRegisteredEvents) {
            const url = registerEvent.relayUrl;
            const relayManager = registerEvent.relayManager;
            try {
                const pingResponse = await this.httpClient.getPingResponse(url);
                relayPings.set(url, { pingResponse });
            }
            catch (error) {
                relayPings.set(url, { error });
            }
            const managerBalance = await this.contractInteractor.getBalance(relayManager);
            balances.set(relayManager, managerBalance);
        }
        return {
            totalStakesByRelays,
            relayRegisteredEvents,
            relayPings,
            balances
        };
    }
}
exports.default = StatusLogic;
//# sourceMappingURL=StatusLogic.js.map