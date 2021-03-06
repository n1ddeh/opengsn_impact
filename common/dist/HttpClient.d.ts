import { PrefixedHexString } from 'ethereumjs-tx';
import { PingResponse } from './PingResponse';
import { LoggerInterface } from './LoggerInterface';
import { HttpWrapper } from './HttpWrapper';
import { RelayTransactionRequest } from './types/RelayTransactionRequest';
import { AuditResponse } from './types/AuditRequest';
export declare class HttpClient {
    private readonly httpWrapper;
    private readonly logger;
    constructor(httpWrapper: HttpWrapper, logger: LoggerInterface);
    getPingResponse(relayUrl: string, paymaster?: string): Promise<PingResponse>;
    relayTransaction(relayUrl: string, request: RelayTransactionRequest): Promise<PrefixedHexString>;
    auditTransaction(relayUrl: string, signedTx: PrefixedHexString): Promise<AuditResponse>;
}
