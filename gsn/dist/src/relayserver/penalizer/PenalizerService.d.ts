import { PrefixedHexString, Transaction as EthereumJsTransaction } from 'ethereumjs-tx';
import ContractInteractor from '../../common/ContractInteractor';
import VersionsManager from '../../common/VersionsManager';
import { BlockExplorerInterface } from './BlockExplorerInterface';
import { LoggerInterface } from '../../common/LoggerInterface';
import { AuditRequest, AuditResponse } from '../../common/types/AuditRequest';
import { TransactionManager } from '../TransactionManager';
import { ServerConfigParams } from '../ServerConfigParams';
export interface PenalizerDependencies {
    transactionManager: TransactionManager;
    contractInteractor: ContractInteractor;
    txByNonceService: BlockExplorerInterface;
}
export declare class PenalizerService {
    transactionManager: TransactionManager;
    contractInteractor: ContractInteractor;
    txByNonceService: BlockExplorerInterface;
    versionManager: VersionsManager;
    logger: LoggerInterface;
    config: ServerConfigParams;
    initialized: boolean;
    managerAddress: string;
    constructor(params: PenalizerDependencies, logger: LoggerInterface, config: ServerConfigParams);
    init(): Promise<void>;
    penalizeRepeatedNonce(req: AuditRequest): Promise<AuditResponse>;
    penalizeIllegalTransaction(req: AuditRequest): Promise<AuditResponse>;
    executePenalization(methodName: string, method: any): Promise<PrefixedHexString>;
    getPenalizeIllegalTransactionMethod(requestTx: EthereumJsTransaction): any;
    getPenalizeRepeatedNonceMethod(minedTx: EthereumJsTransaction, requestTx: EthereumJsTransaction): any;
    validateTransaction(requestTx: EthereumJsTransaction): Promise<{
        valid: boolean;
        error?: string;
    }>;
    isTransactionMined(requestTx: EthereumJsTransaction): Promise<boolean>;
    validatePenalization(method: any): Promise<{
        valid: boolean;
        error?: string;
    }>;
}
