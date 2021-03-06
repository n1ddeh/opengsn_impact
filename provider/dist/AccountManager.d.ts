import { PrefixedHexString } from 'ethereumjs-tx';
import { RelayRequest } from '@opengsn/common/dist/EIP712/RelayRequest';
import { TypedRequestData } from '@opengsn/common/dist/EIP712/TypedRequestData';
import { Address, Web3ProviderBaseInterface } from '@opengsn/common/dist/types/Aliases';
import { GSNConfig } from './GSNConfigurator';
export interface AccountKeypair {
    privateKey: PrefixedHexString;
    address: Address;
}
export declare class AccountManager {
    private readonly web3;
    private readonly accounts;
    private readonly config;
    readonly chainId: number;
    constructor(provider: Web3ProviderBaseInterface, chainId: number, config: GSNConfig);
    addAccount(privateKey: PrefixedHexString): void;
    newAccount(): AccountKeypair;
    sign(relayRequest: RelayRequest): Promise<PrefixedHexString>;
    _signWithProvider(signedData: any): Promise<string>;
    _signWithControlledKey(privateKey: PrefixedHexString, signedData: TypedRequestData): string;
    getAccounts(): string[];
}
