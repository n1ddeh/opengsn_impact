import { PrefixedHexString } from 'ethereumjs-tx';
import { Address } from '../common/types/Aliases';
import { ServerAction, StoredTransaction } from './StoredTransaction';
import { LoggerInterface } from '../common/LoggerInterface';
export declare const TXSTORE_FILENAME = "txstore.db";
export declare class TxStoreManager {
    private readonly txstore;
    private readonly logger;
    constructor({ workdir, inMemory }: {
        workdir?: string | undefined;
        inMemory?: boolean | undefined;
    }, logger: LoggerInterface);
    putTx(tx: StoredTransaction, updateExisting?: boolean): Promise<void>;
    /**
     * Only for testing
     */
    getTxByNonce(signer: PrefixedHexString, nonce: number): Promise<StoredTransaction>;
    /**
     * Only for testing
     */
    getTxById(txId: string): Promise<StoredTransaction>;
    getTxsUntilNonce(signer: PrefixedHexString, nonce: number): Promise<StoredTransaction[]>;
    removeTxsUntilNonce(signer: PrefixedHexString, nonce: number): Promise<unknown>;
    clearAll(): Promise<void>;
    getAllBySigner(signer: PrefixedHexString): Promise<StoredTransaction[]>;
    getAll(): Promise<StoredTransaction[]>;
    isActionPending(serverAction: ServerAction, destination?: Address | undefined): Promise<boolean>;
}
