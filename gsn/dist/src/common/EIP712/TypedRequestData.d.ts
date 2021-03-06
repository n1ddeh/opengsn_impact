import { Address } from '../types/Aliases';
import RelayRequest from './RelayRequest';
import { EIP712Domain, EIP712TypedData, EIP712TypeProperty, EIP712Types } from 'eth-sig-util';
import { PrefixedHexString } from 'ethereumjs-tx';
interface Types extends EIP712Types {
    EIP712Domain: EIP712TypeProperty[];
    RelayRequest: EIP712TypeProperty[];
    RelayData: EIP712TypeProperty[];
}
export declare const GsnDomainSeparatorType: {
    prefix: string;
    name: string;
    version: string;
};
export declare function getDomainSeparator(verifier: Address, chainId: number): EIP712Domain;
export declare function getDomainSeparatorHash(verifier: Address, chainId: number): PrefixedHexString;
export default class TypedRequestData implements EIP712TypedData {
    readonly types: Types;
    readonly domain: EIP712Domain;
    readonly primaryType: string;
    readonly message: any;
    constructor(chainId: number, verifier: Address, relayRequest: RelayRequest);
}
export declare const GsnRequestType: {
    typeName: string;
    typeSuffix: string;
};
export {};
