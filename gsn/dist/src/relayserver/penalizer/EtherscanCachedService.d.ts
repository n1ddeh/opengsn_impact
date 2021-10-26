import { BlockExplorerInterface, TransactionData } from './BlockExplorerInterface';
import { Address } from '../../common/types/Aliases';
import { LoggerInterface } from '../../common/LoggerInterface';
import { TransactionDataCache } from './TransactionDataCache';
export declare class EtherscanCachedService implements BlockExplorerInterface {
    readonly url: string;
    readonly etherscanApiKey: string;
    readonly logger: LoggerInterface;
    readonly transactionDataCache: TransactionDataCache;
    constructor(url: string, etherscanApiKey: string, logger: LoggerInterface, transactionDataCache: TransactionDataCache);
    getTransactionByNonce(address: Address, nonce: number): Promise<TransactionData | undefined>;
    searchTransactionEtherscan(address: string, nonce: number, lastPageQueried: number): Promise<TransactionData | undefined>;
    queryCachedTransactions(address: Address, nonce: number): Promise<{
        transaction?: TransactionData;
        lastPageQueried: number;
    }>;
    cacheResponse(transactions: TransactionData[], sender: Address, page: number): Promise<void>;
}
