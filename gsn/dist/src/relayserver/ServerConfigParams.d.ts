import ContractInteractor from '../common/ContractInteractor';
import { Address, NpmLogLevel } from '../common/types/Aliases';
import { KeyManager } from './KeyManager';
import { TxStoreManager } from './TxStoreManager';
import { LoggerInterface } from '../common/LoggerInterface';
import { GasPriceFetcher } from '../relayclient/GasPriceFetcher';
import { ReputationManager, ReputationManagerConfiguration } from './ReputationManager';
export interface ServerConfigParams {
    baseRelayFee: string;
    pctRelayFee: number;
    url: string;
    port: number;
    versionRegistryAddress: string;
    versionRegistryDelayPeriod?: number;
    relayHubId?: string;
    relayHubAddress: string;
    ethereumNodeUrl: string;
    workdir: string;
    checkInterval: number;
    readyTimeout: number;
    devMode: boolean;
    registrationBlockRate: number;
    maxAcceptanceBudget: number;
    alertedBlockDelay: number;
    minAlertedDelayMS: number;
    maxAlertedDelayMS: number;
    trustedPaymasters: Address[];
    gasPriceFactor: number;
    gasPriceOracleUrl: string;
    gasPriceOraclePath: string;
    logLevel: NpmLogLevel;
    loggerUrl: string;
    loggerUserId: string;
    etherscanApiUrl: string;
    etherscanApiKey: string;
    workerMinBalance: number;
    workerTargetBalance: number;
    managerMinBalance: number;
    managerMinStake: string;
    managerTargetBalance: number;
    minHubWithdrawalBalance: number;
    refreshStateTimeoutBlocks: number;
    pendingTransactionTimeoutBlocks: number;
    successfulRoundsForReady: number;
    confirmationsNeeded: number;
    retryGasPriceFactor: number;
    maxGasPrice: string;
    defaultGasLimit: number;
    runPenalizer: boolean;
    runPaymasterReputations: boolean;
    requiredVersionRange?: string;
}
export interface ServerDependencies {
    managerKeyManager: KeyManager;
    workersKeyManager: KeyManager;
    contractInteractor: ContractInteractor;
    gasPriceFetcher: GasPriceFetcher;
    txStoreManager: TxStoreManager;
    reputationManager?: ReputationManager;
    logger: LoggerInterface;
}
export declare function filterType(config: any, type: string): any;
export declare function entriesToObj(entries: any[]): any;
export declare function filterMembers(env: any, config: any): any;
/**
 * initialize each parameter from commandline, env or config file (in that order)
 * config file must be provided either as command-line or env (obviously, not in
 * the config file..)
 */
export declare function parseServerConfig(args: string[], env: any): any;
export declare function resolveServerConfig(config: Partial<ServerConfigParams>, web3provider: any): Promise<Partial<ServerConfigParams>>;
export declare function resolveReputationManagerConfig(config: any): Partial<ReputationManagerConfiguration>;
export declare function configureServer(partialConfig: Partial<ServerConfigParams>): ServerConfigParams;
