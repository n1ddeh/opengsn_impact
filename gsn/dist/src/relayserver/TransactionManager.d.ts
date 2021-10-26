import { Mutex } from 'async-mutex';
import { PrefixedHexString, Transaction, TransactionOptions } from 'ethereumjs-tx';
import { Address, IntString } from '../common/types/Aliases';
import ContractInteractor from '../common/ContractInteractor';
import { TxStoreManager } from './TxStoreManager';
import { KeyManager } from './KeyManager';
import { ServerConfigParams, ServerDependencies } from './ServerConfigParams';
import { ServerAction, StoredTransaction } from './StoredTransaction';
import { LoggerInterface } from '../common/LoggerInterface';
import { GasPriceFetcher } from '../relayclient/GasPriceFetcher';
export interface SignedTransactionDetails {
    transactionHash: PrefixedHexString;
    signedTx: PrefixedHexString;
}
export interface SendTransactionDetails {
    signer: Address;
    serverAction: ServerAction;
    method?: any;
    destination: Address;
    value?: IntString;
    gasLimit: number;
    gasPrice?: IntString;
    creationBlockNumber: number;
}
export declare class TransactionManager {
    nonceMutex: Mutex;
    managerKeyManager: KeyManager;
    workersKeyManager: KeyManager;
    contractInteractor: ContractInteractor;
    nonces: Record<Address, number>;
    txStoreManager: TxStoreManager;
    config: ServerConfigParams;
    logger: LoggerInterface;
    gasPriceFetcher: GasPriceFetcher;
    rawTxOptions: TransactionOptions;
    constructor(dependencies: ServerDependencies, config: ServerConfigParams);
    _initNonces(): void;
    _init(): Promise<void>;
    printBoostedTransactionLog(txHash: string, creationBlockNumber: number, gasPrice: number, isMaxGasPriceReached: boolean): void;
    printSendTransactionLog(transaction: Transaction, from: Address): void;
    attemptEstimateGas(methodName: string, method: any, from: Address): Promise<number>;
    sendTransaction({ signer, method, destination, value, gasLimit, gasPrice, creationBlockNumber, serverAction }: SendTransactionDetails): Promise<SignedTransactionDetails>;
    updateTransactionWithMinedBlock(tx: StoredTransaction, minedBlockNumber: number): Promise<void>;
    updateTransactionWithAttempt(txToSign: Transaction, tx: StoredTransaction, currentBlock: number): Promise<StoredTransaction>;
    resendTransaction(tx: StoredTransaction, currentBlock: number, newGasPrice: number, isMaxGasPriceReached: boolean): Promise<SignedTransactionDetails>;
    _resolveNewGasPrice(oldGasPrice: number): {
        newGasPrice: number;
        isMaxGasPriceReached: boolean;
    };
    pollNonce(signer: Address): Promise<number>;
    removeConfirmedTransactions(blockNumber: number): Promise<void>;
    /**
     * This methods uses the oldest pending transaction for reference. If it was not mined in a reasonable time,
     * it is boosted all consequent transactions with gas price lower then that are boosted as well.
     */
    boostUnderpricedPendingTransactionsForSigner(signer: string, currentBlockHeight: number): Promise<Map<PrefixedHexString, SignedTransactionDetails>>;
}
