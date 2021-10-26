import PingResponse from '../PingResponse';
import { RelayInfoUrl, RelayRegisteredEventInfo } from './RelayRegisteredEventInfo';
export interface PartialRelayInfo {
    relayInfo: RelayInfoUrl;
    pingResponse: PingResponse;
}
export interface RelayInfo {
    pingResponse: PingResponse;
    relayInfo: RelayRegisteredEventInfo;
}
