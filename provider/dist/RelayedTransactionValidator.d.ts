import { PrefixedHexString } from 'ethereumjs-tx';
import { ContractInteractor } from '@opengsn/common/dist/ContractInteractor';
import { RelayTransactionRequest } from '@opengsn/common/dist/types/RelayTransactionRequest';
import { GSNConfig } from './GSNConfigurator';
import { LoggerInterface } from '@opengsn/common/dist/LoggerInterface';
export declare class RelayedTransactionValidator {
    private readonly contractInteractor;
    private readonly config;
    private readonly logger;
    constructor(contractInteractor: ContractInteractor, logger: LoggerInterface, config: GSNConfig);
    /**
     * Decode the signed transaction returned from the Relay Server, compare it to the
     * requested transaction and validate its signature.
     * @returns a signed {@link Transaction} instance for broadcasting, or null if returned
     * transaction is not valid.
     */
    validateRelayResponse(request: RelayTransactionRequest, maxAcceptanceBudget: number, returnedTx: PrefixedHexString): boolean;
}
