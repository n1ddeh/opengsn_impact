/// <reference types="@openeth/truffle-typings" />
import BN from 'bn.js';
import Web3 from 'web3';
import { BlockTransactionString } from 'web3-eth';
import { EventData, PastEventOptions } from 'web3-eth-contract';
import { PrefixedHexString, TransactionOptions } from 'ethereumjs-tx';
import { BlockNumber, Transaction, TransactionReceipt } from 'web3-core';
import RelayRequest from './EIP712/RelayRequest';
import VersionsManager from './VersionsManager';
import { LoggerInterface } from './LoggerInterface';
import { IForwarderInstance, IKnowForwarderAddressInstance, IPaymasterInstance, IPenalizerInstance, IRelayHubInstance, IRelayRecipientInstance, IStakeManagerInstance } from '../../types/truffle-contracts';
import { Address, IntString, Web3ProviderBaseInterface } from './types/Aliases';
import GsnTransactionDetails from './types/GsnTransactionDetails';
import { GSNContractsDeployment } from './GSNContractsDeployment';
import TransactionDetails = Truffle.TransactionDetails;
declare type EventName = string;
export declare const RelayServerRegistered: EventName;
export declare const RelayWorkersAdded: EventName;
export declare const TransactionRelayed: EventName;
export declare const TransactionRejectedByPaymaster: EventName;
export declare const HubAuthorized: EventName;
export declare const HubUnauthorized: EventName;
export declare const StakeAdded: EventName;
export declare const StakeUnlocked: EventName;
export declare const StakeWithdrawn: EventName;
export declare const StakePenalized: EventName;
export interface ConstructorParams {
    provider: Web3ProviderBaseInterface;
    logger: LoggerInterface;
    versionManager?: VersionsManager;
    deployment?: GSNContractsDeployment;
}
export default class ContractInteractor {
    private readonly IPaymasterContract;
    private readonly IRelayHubContract;
    private readonly IForwarderContract;
    private readonly IStakeManager;
    private readonly IPenalizer;
    private readonly IRelayRecipient;
    private readonly IKnowForwarderAddress;
    private paymasterInstance;
    relayHubInstance: IRelayHubInstance;
    private forwarderInstance;
    private stakeManagerInstance;
    penalizerInstance: IPenalizerInstance;
    private relayRecipientInstance?;
    private knowForwarderAddressInstance?;
    private readonly relayCallMethod;
    readonly web3: Web3;
    private readonly provider;
    private deployment;
    private readonly versionManager;
    private readonly logger;
    private rawTxOptions?;
    chainId: number;
    private networkId?;
    private networkType?;
    constructor({ provider, versionManager, logger, deployment }: ConstructorParams);
    init(): Promise<ContractInteractor>;
    _resolveDeployment(): Promise<void>;
    _resolveDeploymentFromPaymaster(paymasterAddress: Address): Promise<void>;
    _resolveDeploymentFromRelayHub(relayHubAddress: Address): Promise<void>;
    _validateCompatibility(): Promise<void>;
    _validateVersion(version: string): void;
    _initializeContracts(): Promise<void>;
    getRawTxOptions(): TransactionOptions;
    _createKnowsForwarder(address: Address): Promise<IKnowForwarderAddressInstance>;
    _createRecipient(address: Address): Promise<IRelayRecipientInstance>;
    _createPaymaster(address: Address): Promise<IPaymasterInstance>;
    _createRelayHub(address: Address): Promise<IRelayHubInstance>;
    _createForwarder(address: Address): Promise<IForwarderInstance>;
    _createStakeManager(address: Address): Promise<IStakeManagerInstance>;
    _createPenalizer(address: Address): Promise<IPenalizerInstance>;
    getForwarder(recipientAddress: Address): Promise<Address>;
    isTrustedForwarder(recipientAddress: Address, forwarder: Address): Promise<boolean>;
    getSenderNonce(sender: Address, forwarderAddress: Address): Promise<IntString>;
    _getBlockGasLimit(): Promise<number>;
    /**
     * make a view call to relayCall(), just like the way it will be called by the relayer.
     * returns:
     * - paymasterAccepted - true if accepted
     * - reverted - true if relayCall was reverted.
     * - returnValue - if either reverted or paymaster NOT accepted, then this is the reason string.
     */
    validateRelayCall(paymasterMaxAcceptanceBudget: number, relayRequest: RelayRequest, signature: PrefixedHexString, approvalData: PrefixedHexString): Promise<{
        paymasterAccepted: boolean;
        returnValue: string;
        reverted: boolean;
    }>;
    getMaxViewableGasLimit(relayRequest: RelayRequest): Promise<BN>;
    /**
     * decode revert from rpc response.
     * called from the callback of the provider "eth_call" call.
     * check if response is revert, and extract revert reason from it.
     * support kovan, geth, ganache error formats..
     * @param err - provider err value
     * @param res - provider res value
     */
    _decodeRevertFromResponse(err?: {
        message?: string;
        data?: any;
    }, res?: {
        error?: any;
        result?: string;
    }): string | null;
    encodeABI(paymasterMaxAcceptanceBudget: number, relayRequest: RelayRequest, sig: PrefixedHexString, approvalData: PrefixedHexString, externalGasLimit: IntString): PrefixedHexString;
    getPastEventsForHub(extraTopics: string[], options: PastEventOptions, names?: EventName[]): Promise<EventData[]>;
    getPastEventsForStakeManager(names: EventName[], extraTopics: string[], options: PastEventOptions): Promise<EventData[]>;
    _getPastEvents(contract: any, names: EventName[], extraTopics: string[], options: PastEventOptions): Promise<EventData[]>;
    getBalance(address: Address, defaultBlock?: BlockNumber): Promise<string>;
    getBlockNumber(): Promise<number>;
    sendSignedTransaction(rawTx: string): Promise<TransactionReceipt>;
    estimateGas(gsnTransactionDetails: GsnTransactionDetails): Promise<number>;
    getGasPrice(): Promise<string>;
    getTransactionCount(address: string, defaultBlock?: BlockNumber): Promise<number>;
    getTransaction(transactionHash: string): Promise<Transaction>;
    getBlock(blockHashOrBlockNumber: BlockNumber): Promise<BlockTransactionString>;
    validateAddress(address: string, exceptionTitle?: string): void;
    getCode(address: string): Promise<string>;
    getNetworkId(): number;
    getNetworkType(): string;
    isContractDeployed(address: Address): Promise<boolean>;
    getStakeInfo(managerAddress: Address): Promise<{
        stake: string;
        unstakeDelay: string;
        withdrawBlock: string;
        owner: string;
    }>;
    /**
     * Gets balance of an address on the current RelayHub.
     * @param address - can be a Paymaster or a Relay Manger
     */
    hubBalanceOf(address: Address): Promise<BN>;
    initDeployment(deployment: GSNContractsDeployment): Promise<void>;
    getDeployment(): GSNContractsDeployment;
    withdrawHubBalanceEstimateGas(amount: BN, destination: Address, managerAddress: Address, gasPrice: IntString): Promise<{
        gasCost: BN;
        gasLimit: number;
        method: any;
    }>;
    getRegisterRelayMethod(baseRelayFee: IntString, pctRelayFee: number, url: string): Promise<any>;
    getAddRelayWorkersMethod(workers: Address[]): Promise<any>;
    /**
     * Web3.js as of 1.2.6 (see web3-core-method::_confirmTransaction) does not allow
     * broadcasting of a transaction without waiting for it to be mined.
     * This method sends the RPC call directly
     * @param signedTransaction - the raw signed transaction to broadcast
     */
    broadcastTransaction(signedTransaction: PrefixedHexString): Promise<PrefixedHexString>;
    hubDepositFor(paymaster: Address, transactionDetails: TransactionDetails): Promise<any>;
}
/**
 * Ganache does not seem to enforce EIP-155 signature. Buidler does, though.
 * This is how {@link Transaction} constructor allows support for custom and private network.
 * @param chainId
 * @param networkId
 * @param chain
 * @return {{common: Common}}
 */
export declare function getRawTxOptions(chainId: number, networkId: number, chain?: string): TransactionOptions;
export {};
