import { PrefixedHexString, Transaction } from 'ethereumjs-tx';
import { Address } from '../common/types/Aliases';
export declare enum ServerAction {
    REGISTER_SERVER = 0,
    ADD_WORKER = 1,
    RELAY_CALL = 2,
    VALUE_TRANSFER = 3,
    DEPOSIT_WITHDRAWAL = 4,
    PENALIZATION = 5
}
export interface StoredTransactionMetadata {
    readonly from: Address;
    readonly attempts: number;
    readonly serverAction: ServerAction;
    readonly creationBlockNumber: number;
    readonly boostBlockNumber?: number;
    readonly minedBlockNumber?: number;
}
export interface StoredTransactionSerialized {
    readonly to: Address;
    readonly gas: number;
    readonly gasPrice: number;
    readonly data: PrefixedHexString;
    readonly nonce: number;
    readonly txId: PrefixedHexString;
}
export interface NonceSigner {
    nonceSigner?: {
        nonce: number;
        signer: Address;
    };
}
export declare type StoredTransaction = StoredTransactionSerialized & StoredTransactionMetadata & NonceSigner;
/**
 * Make sure not to pass {@link StoredTransaction} as {@param metadata}, as it will override fields from {@param tx}!
 * @param tx
 * @param metadata
 */
export declare function createStoredTransaction(tx: Transaction, metadata: StoredTransactionMetadata): StoredTransaction;
