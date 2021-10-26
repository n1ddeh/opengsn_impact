import { Address } from '../../common/types/Aliases';
import { LoggerInterface } from '../../common/LoggerInterface';
import { TransactionData } from './BlockExplorerInterface';
export declare const TX_STORE_FILENAME = "penalizetxcache.db";
export declare const TX_PAGES_FILENAME = "penalizetxpages.db";
export interface PagesQueried {
    sender: Address;
    page: number;
}
export declare class TransactionDataCache {
    private readonly txstore;
    private readonly pagesStore;
    private readonly logger;
    constructor(logger: LoggerInterface, workdir: string);
    putTransactions(transactions: TransactionData[], sender: Address, page: number): Promise<void>;
    getLastPageQueried(sender: Address): Promise<number>;
    getTransactionByNonce(address: Address, nonce: number): Promise<TransactionData>;
    clearAll(): Promise<void>;
}
