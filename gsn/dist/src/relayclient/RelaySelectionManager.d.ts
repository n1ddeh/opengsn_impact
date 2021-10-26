import { LoggerInterface } from '../common/LoggerInterface';
import GsnTransactionDetails from '../common/types/GsnTransactionDetails';
import { PartialRelayInfo, RelayInfo } from '../common/types/RelayInfo';
import { PingFilter } from '../common/types/Aliases';
import { RelayInfoUrl } from '../common/types/RelayRegisteredEventInfo';
import HttpClient from './HttpClient';
import { GSNConfig } from './GSNConfigurator';
import { KnownRelaysManager } from './KnownRelaysManager';
interface RaceResult {
    winner?: PartialRelayInfo;
    errors: Map<string, Error>;
}
export default class RelaySelectionManager {
    private readonly knownRelaysManager;
    private readonly httpClient;
    private readonly config;
    private readonly logger;
    private readonly pingFilter;
    private readonly gsnTransactionDetails;
    private remainingRelays;
    private isInitialized;
    errors: Map<string, Error>;
    constructor(gsnTransactionDetails: GsnTransactionDetails, knownRelaysManager: KnownRelaysManager, httpClient: HttpClient, pingFilter: PingFilter, logger: LoggerInterface, config: GSNConfig);
    /**
     * Ping those relays that were not pinged yet, and remove both the returned relay or relays re from {@link remainingRelays}
     * @returns the first relay to respond to a ping message. Note: will never return the same relay twice.
     */
    selectNextRelay(): Promise<RelayInfo | undefined>;
    _nextRelayInternal(relays: RelayInfoUrl[]): Promise<RelayInfo | undefined>;
    init(): Promise<this>;
    relaysLeft(): RelayInfoUrl[];
    _getNextSlice(): RelayInfoUrl[];
    /**
     * @returns JSON response from the relay server, but adds the requested URL to it :'-(
     */
    _getRelayAddressPing(relayInfo: RelayInfoUrl): Promise<PartialRelayInfo>;
    /**
     * From https://stackoverflow.com/a/37235207 (added types, modified to catch exceptions)
     * Accepts an array of promises.
     * Resolves once any promise resolves, ignores the rest. Exceptions returned separately.
     */
    _raceToSuccess(relays: RelayInfoUrl[]): Promise<RaceResult>;
    _handleRaceResults(raceResult: RaceResult): void;
}
export {};
