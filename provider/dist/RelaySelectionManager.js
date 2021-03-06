"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ErrorReplacerJSON_1 = require("@opengsn/common/dist/ErrorReplacerJSON");
const GSNContractsDataTypes_1 = require("@opengsn/common/dist/types/GSNContractsDataTypes");
class RelaySelectionManager {
    constructor(gsnTransactionDetails, knownRelaysManager, httpClient, pingFilter, logger, config) {
        this.remainingRelays = [];
        this.isInitialized = false;
        this.errors = new Map();
        this.gsnTransactionDetails = gsnTransactionDetails;
        this.knownRelaysManager = knownRelaysManager;
        this.httpClient = httpClient;
        this.pingFilter = pingFilter;
        this.config = config;
        this.logger = logger;
    }
    /**
     * Ping those relays that were not pinged yet, and remove both the returned relay or relays re from {@link remainingRelays}
     * @returns the first relay to respond to a ping message. Note: will never return the same relay twice.
     */
    async selectNextRelay() {
        while (true) {
            const slice = this._getNextSlice();
            let relayInfo;
            if (slice.length > 0) {
                relayInfo = await this._nextRelayInternal(slice);
                if (relayInfo == null) {
                    continue;
                }
            }
            return relayInfo;
        }
    }
    async _nextRelayInternal(relays) {
        this.logger.info('nextRelay: find fastest relay from: ' + JSON.stringify(relays));
        const raceResult = await this._raceToSuccess(relays);
        this.logger.info(`race finished with a result: ${JSON.stringify(raceResult, ErrorReplacerJSON_1.replaceErrors)}`);
        this._handleRaceResults(raceResult);
        if (raceResult.winner != null) {
            if (GSNContractsDataTypes_1.isInfoFromEvent(raceResult.winner.relayInfo)) {
                return raceResult.winner;
            }
            else {
                const managerAddress = raceResult.winner.pingResponse.relayManagerAddress;
                this.logger.info(`finding relay register info for manager address: ${managerAddress}; known info: ${JSON.stringify(raceResult.winner.relayInfo)}`);
                const events = await this.knownRelaysManager.getRelayInfoForManagers(new Set([managerAddress]));
                if (events.length === 1) {
                    // as preferred relay URL is not guaranteed to match the advertised one for the same manager, preserve URL
                    const relayInfo = events[0];
                    relayInfo.relayUrl = raceResult.winner.relayInfo.relayUrl;
                    return {
                        pingResponse: raceResult.winner.pingResponse,
                        relayInfo
                    };
                }
                else {
                    // TODO: do not throw! The preferred relay may be removed since.
                    throw new Error('Could not find register event for the winning preferred relay');
                }
            }
        }
    }
    async init() {
        this.remainingRelays = await this.knownRelaysManager.getRelaysSortedForTransaction(this.gsnTransactionDetails);
        this.isInitialized = true;
        return this;
    }
    // relays left to try
    // (note that some edge-cases (like duplicate urls) are not filtered out)
    relaysLeft() {
        return this.remainingRelays.flatMap(list => list);
    }
    _getNextSlice() {
        if (!this.isInitialized) {
            throw new Error('init() not called');
        }
        for (const relays of this.remainingRelays) {
            const bulkSize = Math.min(this.config.sliceSize, relays.length);
            const slice = relays.slice(0, bulkSize);
            if (slice.length === 0) {
                continue;
            }
            return slice;
        }
        return [];
    }
    /**
     * @returns JSON response from the relay server, but adds the requested URL to it :'-(
     */
    async _getRelayAddressPing(relayInfo) {
        this.logger.info(`getRelayAddressPing URL: ${relayInfo.relayUrl}`);
        const pingResponse = await this.httpClient.getPingResponse(relayInfo.relayUrl, this.gsnTransactionDetails.paymaster);
        if (!pingResponse.ready) {
            throw new Error(`Relay not ready ${JSON.stringify(pingResponse)}`);
        }
        this.pingFilter(pingResponse, this.gsnTransactionDetails);
        return {
            pingResponse,
            relayInfo
        };
    }
    /**
     * From https://stackoverflow.com/a/37235207 (added types, modified to catch exceptions)
     * Accepts an array of promises.
     * Resolves once any promise resolves, ignores the rest. Exceptions returned separately.
     */
    async _raceToSuccess(relays) {
        const errors = new Map();
        return await new Promise((resolve) => {
            relays.forEach((relay) => {
                this._getRelayAddressPing(relay)
                    .then((winner) => {
                    resolve({
                        winner,
                        errors
                    });
                })
                    .catch((err) => {
                    errors.set(relay.relayUrl, err);
                    if (errors.size === relays.length) {
                        resolve({ errors });
                    }
                });
            });
        });
    }
    _handleRaceResults(raceResult) {
        if (!this.isInitialized) {
            throw new Error('init() not called');
        }
        this.errors = new Map([...this.errors, ...raceResult.errors]);
        this.remainingRelays = this.remainingRelays.map(relays => relays
            .filter(eventInfo => { var _a; return eventInfo.relayUrl !== ((_a = raceResult.winner) === null || _a === void 0 ? void 0 : _a.relayInfo.relayUrl); })
            .filter(eventInfo => !Array.from(raceResult.errors.keys()).includes(eventInfo.relayUrl)));
    }
}
exports.RelaySelectionManager = RelaySelectionManager;
//# sourceMappingURL=RelaySelectionManager.js.map