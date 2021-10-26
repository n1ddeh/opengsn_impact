/// <reference types="@openeth/truffle-typings" />
import BN from 'bn.js';
import { EventData } from 'web3-eth-contract';
import { PrefixedHexString, Transaction, TransactionOptions } from 'ethereumjs-tx';
import { Address } from './types/Aliases';
import { ServerConfigParams } from '../relayserver/ServerConfigParams';
import TypedRequestData from './EIP712/TypedRequestData';
export declare function removeHexPrefix(hex: string): string;
export declare function padTo64(hex: string): string;
export declare function event2topic(contract: any, names: any): any;
export declare function addresses2topics(addresses: string[]): string[];
export declare function address2topic(address: string): string;
export declare function decodeRevertReason(revertBytes: PrefixedHexString, throwOnError?: boolean): string | null;
export declare function getEip712Signature(web3: Web3, typedRequestData: TypedRequestData, methodSuffix?: string, jsonStringifyRequest?: boolean): Promise<PrefixedHexString>;
/**
 * @returns maximum possible gas consumption by this relayed call
 */
export declare function calculateTransactionMaxPossibleGas({ gasLimits, hubOverhead, relayCallGasLimit }: TransactionGasComponents): number;
export declare function getEcRecoverMeta(message: PrefixedHexString, signature: string | Signature): PrefixedHexString;
export declare function parseHexString(str: string): number[];
export declare function isSameAddress(address1: Address, address2: Address): boolean;
export declare function sleep(ms: number): Promise<void>;
export declare function ether(n: string): BN;
export declare function randomInRange(min: number, max: number): number;
export declare function isSecondEventLater(a: EventData, b: EventData): boolean;
export declare function getLatestEventData(events: EventData[]): EventData | undefined;
export declare function isRegistrationValid(registerEvent: EventData | undefined, config: ServerConfigParams, managerAddress: Address): boolean;
/**
 * @param gasLimits
 * @param hubOverhead
 * @param relayCallGasLimit
 * @param calldataSize
 * @param gtxdatanonzero
 */
interface TransactionGasComponents {
    gasLimits: PaymasterGasLimits;
    hubOverhead: number;
    relayCallGasLimit: string;
}
export interface PaymasterGasLimits {
    acceptanceBudget: string;
    preRelayedCallGasLimit: string;
    postRelayedCallGasLimit: string;
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
