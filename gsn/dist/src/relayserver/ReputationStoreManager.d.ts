import { LoggerInterface } from '../common/LoggerInterface';
import { ReputationEntry } from './ReputationEntry';
import { Address } from '../common/types/Aliases';
export declare const REPUTATION_STORE_FILENAME = "reputation_store.db";
export declare class ReputationStoreManager {
    private readonly txstore;
    private readonly logger;
    constructor({ workdir, inMemory }: {
        workdir?: string | undefined;
        inMemory?: boolean | undefined;
    }, logger: LoggerInterface);
    createEntry(paymaster: Address, reputation: number): Promise<ReputationEntry>;
    clearAbuseFlag(paymaster: Address, reputation: number): Promise<void>;
    setAbuseFlag(paymaster: Address, eventBlockNumber: number): Promise<void>;
    updateLastAcceptedTimestamp(paymaster: Address): Promise<void>;
    updatePaymasterReputation(paymaster: Address, change: number, oldChangesExpirationBlock: number, eventBlockNumber: number): Promise<void>;
    private updateEntry;
    getEntry(paymaster: Address): Promise<ReputationEntry | undefined>;
    clearAll(): Promise<void>;
}
