import { Address } from '../common/types/Aliases';
import { LoggerInterface } from '../common/LoggerInterface';
import { ReputationStoreManager } from './ReputationStoreManager';
export interface ReputationManagerConfiguration {
    /** All new Paymasters start with their reputation set to this value  */
    initialReputation: number;
    /** No matter how good the Paymaster is, it's reputation cannot go above this value */
    maximumReputation: number;
    /** If the reputation is below this value, transactions will only be allowed each {@link throttleDelayMs} */
    throttleReputation: number;
    /** Minimum interval between transactions paid by a specific throttled Paymaster */
    throttleDelayMs: number;
    /** Paymasters with reputation below this value will never be served */
    blockReputation: number;
    /** If a paymaster loses this number of reputation points within {@link abuseTimeWindowBlocks}, it
     * will be blocked for {@link abuseBlacklistDurationBlocks}
     */
    abuseReputationChange: number;
    abuseTimeWindowBlocks: number;
    abuseBlacklistDurationBlocks: number;
    /** After {@link abuseBlacklistDurationBlocks}, the Paymaster reputation will be reset to this value */
    abuseTimeoutReputation: number;
}
/**
 * Only Paymaster marked as {@link GOOD} is to be allowed to proceed.
 * Note: {@link THROTTLED} value is returned only if subsequent transaction is requested too soon.
 */
export declare enum PaymasterStatus {
    GOOD = 0,
    THROTTLED = 1,
    ABUSED = 2,
    BLOCKED = 3
}
export declare class ReputationManager {
    config: ReputationManagerConfiguration;
    reputationStoreManager: ReputationStoreManager;
    logger: LoggerInterface;
    constructor(reputationStoreManager: ReputationStoreManager, logger: LoggerInterface, partialConfig: Partial<ReputationManagerConfiguration>);
    getPaymasterStatus(paymaster: Address, currentBlockNumber: number): Promise<PaymasterStatus>;
    onRelayRequestAccepted(paymaster: Address): Promise<void>;
    updatePaymasterStatus(paymaster: Address, transactionSuccess: boolean, eventBlockNumber: number): Promise<void>;
}
