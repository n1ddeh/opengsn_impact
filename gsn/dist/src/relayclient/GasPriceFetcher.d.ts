import { LoggerInterface } from '../common/LoggerInterface';
import ContractInteractor from '../common/ContractInteractor';
export declare class GasPriceFetcher {
    readonly gasPriceOracleUrl: string;
    readonly gasPriceOraclePath: string;
    readonly contractInteractor: ContractInteractor;
    readonly logger: LoggerInterface;
    constructor(gasPriceOracleUrl: string, gasPriceOraclePath: string, contractInteractor: ContractInteractor, logger: LoggerInterface);
    getJsonElement(blob: any, path: string, origPath?: string): string | null;
    getGasPrice(): Promise<string>;
}
