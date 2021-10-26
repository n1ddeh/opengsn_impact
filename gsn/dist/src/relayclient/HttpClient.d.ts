import { PrefixedHexString } from 'ethereumjs-tx';
import PingResponse from '../common/PingResponse';
import { LoggerInterface } from '../common/LoggerInterface';
import HttpWrapper from './HttpWrapper';
import { RelayTransactionRequest } from '../common/types/RelayTransactionRequest';
import { AuditResponse } from '../common/types/AuditRequest';
export default class HttpClient {
    private readonly httpWrapper;
    private readonly logger;
    constructor(httpWrapper: HttpWrapper, logger: LoggerInterface);
    getPingResponse(relayUrl: string, paymaster?: string): Promise<PingResponse>;
    relayTransaction(relayUrl: string, request: RelayTransactionRequest): Promise<PrefixedHexString>;
    auditTransaction(relayUrl: string, signedTx: PrefixedHexString): Promise<AuditResponse>;
}
