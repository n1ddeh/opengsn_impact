import BN from 'bn.js';
import { Contract, SendOptions } from 'web3-eth-contract';
import { Address } from '../common/types/Aliases';
import { RelayHubConfiguration } from '../common/types/RelayHubConfiguration';
import { LoggerInterface } from '../common/LoggerInterface';
import { GSNContractsDeployment } from '../common/GSNContractsDeployment';
export interface RegisterOptions {
    from: Address;
    gasPrice: string | BN;
    stake: string | BN;
    funds: string | BN;
    relayUrl: string;
    unstakeDelay: string;
}
interface DeployOptions {
    from: Address;
    gasPrice: string;
    deployPaymaster?: boolean;
    forwarderAddress?: string;
    relayHubAddress?: string;
    stakeManagerAddress?: string;
    penalizerAddress?: string;
    registryAddress?: string;
    registryHubId?: string;
    verbose?: boolean;
    skipConfirmation?: boolean;
    relayHubConfiguration: RelayHubConfiguration;
}
interface RegistrationResult {
    success: boolean;
    transactions?: string[];
    error?: string;
}
export default class CommandsLogic {
    private readonly contractInteractor;
    private readonly httpClient;
    private readonly web3;
    private deployment?;
    constructor(host: string, logger: LoggerInterface, deployment: GSNContractsDeployment, mnemonic?: string);
    init(): Promise<this>;
    findWealthyAccount(requiredBalance?: BN): Promise<string>;
    isRelayReady(relayUrl: string): Promise<boolean>;
    waitForRelay(relayUrl: string, timeout?: number): Promise<void>;
    getPaymasterBalance(paymaster: Address): Promise<BN>;
    /**
     * Send enough ether from the {@param from} to the RelayHub to make {@param paymaster}'s gas deposit exactly {@param amount}.
     * Does nothing if current paymaster balance exceeds amount.
     * @param from
     * @param paymaster
     * @param amount
     * @return deposit of the paymaster after
     */
    fundPaymaster(from: Address, paymaster: Address, amount: string | BN): Promise<BN>;
    registerRelay(options: RegisterOptions): Promise<RegistrationResult>;
    contract(file: any, address?: string): Contract;
    deployGsnContracts(deployOptions: DeployOptions): Promise<GSNContractsDeployment>;
    private getContractInstance;
    deployPaymaster(options: Required<SendOptions>, hub: Address, from: string, fInstance: Contract, skipConfirmation: boolean | undefined): Promise<Contract>;
    confirm(): Promise<void>;
}
export {};
