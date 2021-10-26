import { CommanderStatic } from 'commander';
import { RelayHubConfiguration } from '../common/types/RelayHubConfiguration';
import { GSNContractsDeployment } from '../common/GSNContractsDeployment';
export declare const networks: Map<string, string>;
export declare function supportedNetworks(): string[];
export declare function getNetworkUrl(network: string, env?: {
    [key: string]: string | undefined;
}): string;
export declare function getMnemonic(mnemonicFile: string): string | undefined;
export declare function getRelayHubConfiguration(configFile: string): RelayHubConfiguration | undefined;
export declare function getPaymasterAddress(paymaster?: string): string | undefined;
export declare function getRelayHubAddress(defaultAddress?: string): string | undefined;
export declare function getRegistryAddress(defaultAddress?: string): string | undefined;
export declare function saveDeployment(deploymentResult: GSNContractsDeployment, workdir: string): void;
export declare function showDeployment(deploymentResult: GSNContractsDeployment, title: string | undefined, paymasterTitle?: string | undefined): void;
export declare function loadDeployment(workdir: string): GSNContractsDeployment;
declare type GsnOption = 'n' | 'f' | 'h' | 'm' | 'g';
export declare function gsnCommander(options: GsnOption[]): CommanderStatic;
export {};
