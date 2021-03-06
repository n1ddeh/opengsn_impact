/// <reference types="node" />
import BN from 'bn.js';
import { EventData } from 'web3-eth-contract';
import { PrefixedHexString, Transaction, TransactionOptions } from 'ethereumjs-tx';
import { Address } from './types/Aliases';
import { TypedRequestData } from './EIP712/TypedRequestData';
export declare function removeHexPrefix(hex: string): string;
export declare function padTo64(hex: string): string;
export declare function signatureRSV2Hex(r: BN | Buffer, s: BN | Buffer, v: number): string;
export declare function event2topic(contract: any, names: string[]): any;
export declare function addresses2topics(addresses: string[]): string[];
export declare function address2topic(address: string): string;
export declare function decodeRevertReason(revertBytes: PrefixedHexString, throwOnError?: boolean): string | null;
export declare function getEip712Signature(web3: Web3, typedRequestData: TypedRequestData, methodSuffix?: string, jsonStringifyRequest?: boolean): Promise<PrefixedHexString>;
/**
 * @returns the actual cost of putting this transaction on chain.
 */
export declare function calculateCalldataCost(calldata: string): number;
/**
 * @returns maximum possible gas consumption by this relayed call
 * (calculated on chain by RelayHub.verifyGasAndDataLimits)
 */
export declare function calculateTransactionMaxPossibleGas({ gasAndDataLimits, hubOverhead, relayCallGasLimit, msgData, msgDataGasCostInsideTransaction }: TransactionGasCostComponents): number;
export declare function getEcRecoverMeta(message: PrefixedHexString, signature: string | Signature): PrefixedHexString;
export declare function parseHexString(str: string): number[];
export declare function isSameAddress(address1: Address, address2: Address): boolean;
export declare function sleep(ms: number): Promise<void>;
export declare function ether(n: string): BN;
export declare function randomInRange(min: number, max: number): number;
export declare function eventsComparator(a: EventData, b: EventData): number;
export declare function isSecondEventLater(a: EventData, b: EventData): boolean;
export declare function getLatestEventData(events: EventData[]): EventData | undefined;
/**
 * @param gasLimits
 * @param hubOverhead
 * @param relayCallGasLimit
 * @param calldataSize
 * @param gtxdatanonzero
 */
interface TransactionGasCostComponents {
    gasAndDataLimits: PaymasterGasAndDataLimits;
    hubOverhead: number;
    relayCallGasLimit: string;
    msgData: string;
    msgDataGasCostInsideTransaction: number;
}
export interface PaymasterGasAndDataLimits {
    acceptanceBudget: BN;
    preRelayedCallGasLimit: BN;
    postRelayedCallGasLimit: BN;
    calldataSizeLimit: BN;
}
interface Signature {
    v: number[];
    r: number[];
    s: number[];
}
export declare function boolString(bool: boolean): string;
export declare function getDataAndSignature(tx: Transaction, chainId: number): {
    data: string;
    signature: string;
};
export declare function signedTransactionToHash(signedTransaction: PrefixedHexString, transactionOptions: TransactionOptions): PrefixedHexString;
export {};
