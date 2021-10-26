/// <reference types="@openeth/truffle-typings" />
/// <reference types="node" />
import { EventData } from 'web3-eth-contract';
import { EventEmitter } from 'events';
import { PrefixedHexString } from 'ethereumjs-tx';
import { IRelayHubInstance } from '../../types/truffle-contracts';
import ContractInteractor from '../common/ContractInteractor';
import { GasPriceFetcher } from '../relayclient/GasPriceFetcher';
import { Address, IntString } from '../common/types/Aliases';
import { RelayTransactionRequest } from '../common/types/RelayTransactionRequest';
import PingResponse from '../common/PingResponse';
import { AmountRequired } from '../common/AmountRequired';
import { LoggerInterface } from '../common/LoggerInterface';
import { PaymasterGasLimits } from '../common/Utils';
import { RegistrationManager } from './RegistrationManager';
import { ReputationManager } from './ReputationManager';
import { SignedTransactionDetails, TransactionManager } from './TransactionManager';
import { TxStoreManager } from './TxStoreManager';
import { ServerConfigParams, ServerDependencies } from './ServerConfigParams';
export declare class RelayServer extends EventEmitter {
    readonly logger: LoggerInterface;
    lastScannedBlock: number;
    lastRefreshBlock: number;
    ready: boolean;
    lastSuccessfulRounds: number;
    readonly managerAddress: PrefixedHexString;
    readonly workerAddress: PrefixedHexString;
    gasPrice: number;
    _workerSemaphoreOn: boolean;
    alerted: boolean;
    alertedBlock: number;
    private initialized;
    readonly contractInteractor: ContractInteractor;
    readonly gasPriceFetcher: GasPriceFetcher;
    private readonly versionManager;
    private workerTask?;
    config: ServerConfigParams;
    transactionManager: TransactionManager;
    txStoreManager: TxStoreManager;
    lastMinedActiveTransaction?: EventData;
    reputationManager: ReputationManager;
    registrationManager: RegistrationManager;
    chainId: number;
    networkId: number;
    relayHubContract: IRelayHubInstance;
    trustedPaymastersGasLimits: Map<String | undefined, PaymasterGasLimits>;
    workerBalanceRequired: AmountRequired;
    constructor(config: Partial<ServerConfigParams>, transactionManager: TransactionManager, dependencies: ServerDependencies);
    printServerAddresses(): void;
    getMinGasPrice(): number;
    pingHandler(paymaster?: string): Promise<PingResponse>;
    validateInput(req: RelayTransactionRequest): void;
    validateFees(req: RelayTransactionRequest): void;
    validateMaxNonce(relayMaxNonce: number): Promise<void>;
    validatePaymasterReputation(paymaster: Address, currentBlockNumber: number): Promise<void>;
    validatePaymasterGasLimits(req: RelayTransactionRequest): Promise<{
        maxPossibleGas: number;
        acceptanceBudget: number;
    }>;
    validateViewCallSucceeds(req: RelayTransactionRequest, acceptanceBudget: number, maxPossibleGas: number): Promise<void>;
    createRelayTransaction(req: RelayTransactionRequest): Promise<PrefixedHexString>;
    intervalHandler(): Promise<void>;
    start(): void;
    stop(): void;
    _workerSemaphore(blockNumber: number): Promise<void>;
    fatal(message: string): void;
    /***
     * initialize data from trusted paymasters.
     * "Trusted" paymasters means that:
     * - we trust their code not to alter the gas limits (getGasLimits returns constants)
     * - we trust preRelayedCall to be consistent: off-chain call and on-chain calls should either both succeed
     *    or both revert.
     * - given that, we agree to give the requested acceptanceBudget (since breaking one of the above two "invariants"
     *    is the only cases where the relayer will have to pay for this budget)
     *
     * @param paymasters list of trusted paymaster addresses
     */
    _initTrustedPaymasters(paymasters?: string[]): Promise<void>;
    _getPaymasterMaxAcceptanceBudget(paymaster?: string): IntString;
    init(): Promise<void>;
    replenishServer(workerIndex: number, currentBlock: number): Promise<PrefixedHexString[]>;
    _worker(blockNumber: number): Promise<PrefixedHexString[]>;
    _refreshGasPrice(): Promise<void>;
    _handleChanges(currentBlockNumber: number): Promise<PrefixedHexString[]>;
    getManagerBalance(): Promise<BN>;
    getWorkerBalance(workerIndex: number): Promise<BN>;
    _shouldRegisterAgain(currentBlock: number, hubEventsSinceLastScan: EventData[]): Promise<boolean>;
    _shouldRefreshState(currentBlock: number): boolean;
    handlePastHubEvents(currentBlockNumber: number, hubEventsSinceLastScan: EventData[]): Promise<void>;
    getAllHubEventsSinceLastScan(): Promise<EventData[]>;
    _handleTransactionRelayedEvent(paymaster: Address, eventBlockNumber: number): Promise<void>;
    _handleTransactionRejectedByPaymasterEvent(paymaster: Address, currentBlockNumber: number, eventBlockNumber: number): Promise<void>;
    _getLatestTxBlockNumber(): number;
    _updateLatestTxBlockNumber(eventsSinceLastScan: EventData[]): Promise<void>;
    _queryLatestActiveEvent(): Promise<EventData | undefined>;
    /**
     * Resend all outgoing pending transactions with insufficient gas price by all signers (manager, workers)
     * @return the mapping of the previous transaction hash to details of a new boosted transaction
     */
    _boostStuckPendingTransactions(blockNumber: number): Promise<Map<PrefixedHexString, SignedTransactionDetails>>;
    _boostStuckTransactionsForManager(blockNumber: number): Promise<Map<PrefixedHexString, SignedTransactionDetails>>;
    _boostStuckTransactionsForWorker(blockNumber: number, workerIndex: number): Promise<Map<PrefixedHexString, SignedTransactionDetails>>;
    _isTrustedPaymaster(paymaster: string): boolean;
    isReady(): boolean;
    setReadyState(isReady: boolean): void;
}
