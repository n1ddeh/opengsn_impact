import GsnTransactionDetails from '../common/types/GsnTransactionDetails';
import RelayFailureInfo from '../common/types/RelayFailureInfo';
import { Address, AsyncScoreCalculator, RelayFilter } from '../common/types/Aliases';
import { GSNConfig } from './GSNConfigurator';
import { RelayInfoUrl, RelayRegisteredEventInfo } from '../common/types/RelayRegisteredEventInfo';
import ContractInteractor from '../common/ContractInteractor';
import { LoggerInterface } from '../common/LoggerInterface';
import { EventData } from 'web3-eth-contract';
export declare const EmptyFilter: RelayFilter;
/**
 * Basic score is reversed transaction fee, higher is better.
 * Relays that failed to respond recently will be downgraded for some period of time.
 */
export declare const DefaultRelayScore: (relay: RelayRegisteredEventInfo, txDetails: GsnTransactionDetails, failures: RelayFailureInfo[]) => Promise<number>;
export declare class KnownRelaysManager {
    private readonly contractInteractor;
    private readonly logger;
    private readonly config;
    private readonly relayFilter;
    private readonly scoreCalculator;
    private latestScannedBlock;
    private relayFailures;
    relayLookupWindowParts: number;
    preferredRelayers: RelayInfoUrl[];
    allRelayers: RelayInfoUrl[];
    constructor(contractInteractor: ContractInteractor, logger: LoggerInterface, config: GSNConfig, relayFilter?: RelayFilter, scoreCalculator?: AsyncScoreCalculator);
    refresh(): Promise<void>;
    getRelayInfoForManagers(relayManagers: Set<Address>): Promise<RelayRegisteredEventInfo[]>;
    splitRange(fromBlock: number, toBlock: number, splits: number): Array<{
        fromBlock: number;
        toBlock: number;
    }>;
    getPastEventsForHub(fromBlock: number, toBlock: number): Promise<EventData[]>;
    _fetchRecentlyActiveRelayManagers(): Promise<Set<Address>>;
    _refreshFailures(): void;
    getRelaysSortedForTransaction(gsnTransactionDetails: GsnTransactionDetails): Promise<RelayInfoUrl[][]>;
    getAuditors(excludeUrls: string[]): string[];
    _sortRelaysInternal(gsnTransactionDetails: GsnTransactionDetails, activeRelays: RelayInfoUrl[]): Promise<RelayInfoUrl[]>;
    saveRelayFailure(lastErrorTime: number, relayManager: Address, relayUrl: string): void;
}
