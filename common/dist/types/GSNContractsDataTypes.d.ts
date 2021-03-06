import { Address, EventName, IntString } from './Aliases';
import BN from 'bn.js';
import { PrefixedHexString } from 'ethereumjs-tx';
export interface GNSContractsEvent {
}
/** IPenalizer.sol */
export declare const CommitAdded: EventName;
/** IRelayHub.sol */
export declare const RelayServerRegistered: EventName;
export declare const RelayWorkersAdded: EventName;
export declare const TransactionRejectedByPaymaster: EventName;
export declare const TransactionRelayed: EventName;
export declare const Deposited: EventName;
/**
 * Emitting any of these events is handled by GSN clients as a sign of activity by a RelayServer.
 */
export declare const ActiveManagerEvents: string[];
export interface RelayInfoUrl {
    relayUrl: string;
}
export interface RelayRegisteredEventInfo extends RelayInfoUrl, GNSContractsEvent {
    relayManager: Address;
    baseRelayFee: IntString;
    pctRelayFee: IntString;
}
export interface TransactionRelayedEventInfo extends GNSContractsEvent {
    relayManager: Address;
    relayWorker: Address;
    from: Address;
    to: Address;
    paymaster: Address;
    selector: PrefixedHexString;
    status: IntString;
    charge: IntString;
}
export interface TransactionRejectedByPaymasterEventInfo extends GNSContractsEvent {
    relayManager: Address;
    paymaster: Address;
    from: Address;
    to: Address;
    relayWorker: Address;
    selector: PrefixedHexString;
    innerGasUsed: IntString;
    reason: PrefixedHexString;
}
export interface DepositedEventInfo extends GNSContractsEvent {
    paymaster: Address;
    from: Address;
    amount: IntString;
}
export declare function isInfoFromEvent(info: RelayInfoUrl): boolean;
/** IStakeManager.sol */
export declare const HubAuthorized: EventName;
export declare const HubUnauthorized: EventName;
export declare const StakeAdded: EventName;
export declare const StakePenalized: EventName;
export declare const StakeUnlocked: EventName;
export declare const StakeWithdrawn: EventName;
export declare const OwnerSet: EventName;
export declare const allStakeManagerEvents: string[];
export interface StakeAddedEventInfo extends GNSContractsEvent {
    relayManager: Address;
    owner: Address;
    stake: IntString;
    unstakeDelay: IntString;
}
export interface StakeUnlockedEventInfo extends GNSContractsEvent {
    relayManager: Address;
    owner: Address;
    withdrawBlock: IntString;
}
export interface StakeWithdrawnEventInfo extends GNSContractsEvent {
    relayManager: Address;
    owner: Address;
    amount: IntString;
}
export interface StakePenalizedEventInfo extends GNSContractsEvent {
    relayManager: Address;
    beneficiary: Address;
    reward: IntString;
}
export declare type StakeChangeEvent = StakeAddedEventInfo | StakeUnlockedEventInfo | StakeWithdrawnEventInfo | StakePenalizedEventInfo;
export interface HubAuthorizedEventInfo extends GNSContractsEvent {
    relayManager: Address;
    relayHub: Address;
}
export interface HubUnauthorizedEventInfo extends GNSContractsEvent {
    relayManager: Address;
    relayHub: Address;
    removalBlock: IntString;
}
export interface StakeInfo {
    stake: BN;
    unstakeDelay: BN;
    withdrawBlock: BN;
    owner: Address;
}
