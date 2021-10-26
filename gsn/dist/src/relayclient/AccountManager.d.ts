import { PrefixedHexString } from 'ethereumjs-tx';
import RelayRequest from '../common/EIP712/RelayRequest';
import TypedRequestData from '../common/EIP712/TypedRequestData';
import { Address, Web3ProviderBaseInterface } from '../common/types/Aliases';
import { GSNConfig } from './GSNConfigurator';
export interface AccountKeypair {
    privateKey: PrefixedHexString;
    address: Address;
}
export default class AccountManager {
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
