/// <reference types="node" />
import { EventData, PastEventOptions } from 'web3-eth-contract';
import { EventEmitter } from 'events';
import { PrefixedHexString } from 'ethereumjs-tx';
import { Address, IntString } from '../common/types/Aliases';
import { AmountRequired } from '../common/AmountRequired';
import ContractInteractor from '../common/ContractInteractor';
import { TransactionManager } from './TransactionManager';
import { ServerConfigParams } from './ServerConfigParams';
import { TxStoreManager } from './TxStoreManager';
import { LoggerInterface } from '../common/LoggerInterface';
export interface RelayServerRegistryInfo {
    baseRelayFee: IntString;
    pctRelayFee: number;
    url: string;
}
export declare class RegistrationManager {
    balanceRequired: AmountRequired;
    stakeRequired: AmountRequired;
    _isHubAuthorized: boolean;
    _isStakeLocked: boolean;
    isInitialized: boolean;
    hubAddress: Address;
    managerAddress: Address;
    workerAddress: Address;
    eventEmitter: EventEmitter;
    contractInteractor: ContractInteractor;
    ownerAddress?: Address;
    transactionManager: TransactionManager;
    config: ServerConfigParams;
    txStoreManager: TxStoreManager;
    logger: LoggerInterface;
    lastMinedRegisterTransaction?: EventData;
    lastWorkerAddedTransaction?: EventData;
    private delayedEvents;
    get isHubAuthorized(): boolean;
    set isHubAuthorized(newValue: boolean);
    get isStakeLocked(): boolean;
    set isStakeLocked(newValue: boolean);
    constructor(contractInteractor: ContractInteractor, transactionManager: TransactionManager, txStoreManager: TxStoreManager, eventEmitter: EventEmitter, logger: LoggerInterface, config: ServerConfigParams, managerAddress: Address, workerAddress: Address);
    init(): Promise<void>;
    handlePastEvents(hubEventsSinceLastScan: EventData[], lastScannedBlock: number, currentBlock: number, forceRegistration: boolean): Promise<PrefixedHexString[]>;
    _extractDuePendingEvents(currentBlock: number): EventData[];
    _isRegistrationCorrect(): boolean;
    _queryLatestRegistrationEvent(): Promise<EventData | undefined>;
    _parseEvent(event: {
        events: any[];
        name: string;
        address: string;
    } | null): any;
    _handleHubAuthorizedEvent(dlog: EventData): Promise<void>;
    _handleHubUnauthorizedEvent(dlog: EventData, currentBlock: number): Promise<PrefixedHexString[]>;
    _handleStakeWithdrawnEvent(dlog: EventData, currentBlock: number): Promise<PrefixedHexString[]>;
    /**
     * @param withdrawManager - whether to send the relay manager's balance to the owner.
     *        Note that more than one relay process could be using the same manager account.
     * @param currentBlock
     */
    withdrawAllFunds(withdrawManager: boolean, currentBlock: number): Promise<PrefixedHexString[]>;
    refreshBalance(): Promise<void>;
    refreshStake(): Promise<void>;
    addRelayWorker(currentBlock: number): Promise<PrefixedHexString>;
    attemptRegistration(currentBlock: number): Promise<PrefixedHexString[]>;
    _sendManagerEthBalanceToOwner(currentBlock: number): Promise<PrefixedHexString[]>;
    _sendWorkersEthBalancesToOwner(currentBlock: number): Promise<PrefixedHexString[]>;
    _sendManagerHubBalanceToOwner(currentBlock: number): Promise<PrefixedHexString[]>;
    _queryLatestWorkerAddedEvent(): Promise<EventData | undefined>;
    _isWorkerValid(): boolean;
    isRegistered(): Promise<boolean>;
    printNotRegisteredMessage(): void;
    printEvents(decodedEvents: EventData[], options: PastEventOptions): void;
}
