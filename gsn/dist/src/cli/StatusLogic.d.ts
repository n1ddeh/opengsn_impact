import ContractInteractor from '../common/ContractInteractor';
import HttpClient from '../relayclient/HttpClient';
import PingResponse from '../common/PingResponse';
import { RelayRegisteredEventInfo } from '../common/types/RelayRegisteredEventInfo';
import { Address } from '../common/types/Aliases';
interface StatusConfig {
    blockHistoryCount: number;
    getAddressTimeout: number;
    relayHubAddress: Address;
}
interface PingAttempt {
    pingResponse?: PingResponse;
    error?: Error;
}
interface Statistics {
    totalStakesByRelays: string;
    relayRegisteredEvents: RelayRegisteredEventInfo[];
    relayPings: Map<string, PingAttempt>;
    balances: Map<Address, string>;
}
export default class StatusLogic {
    private readonly contractInteractor;
    private readonly httpClient;
    private readonly config;
    constructor(contractInteractor: ContractInteractor, httpClient: HttpClient, config: StatusConfig);
    gatherStatistics(): Promise<Statistics>;
}
export {};
