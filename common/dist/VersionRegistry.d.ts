import { PrefixedHexString } from 'ethereumjs-tx';
import { ContractInteractor } from './ContractInteractor';
import TransactionDetails = Truffle.TransactionDetails;
export declare function string32(s: string): PrefixedHexString;
export declare function bytes32toString(s: PrefixedHexString): string;
export interface VersionInfo {
    value: string;
    version: string;
    time: number;
    canceled: boolean;
    cancelReason: string;
}
export declare class VersionRegistry {
    fromBlock: number;
    contractInteractor: ContractInteractor;
    constructor(fromBlock: number, contractInteractor: ContractInteractor);
    isValid(): Promise<boolean>;
    /**
     * return the latest "mature" version from the registry
     *
     * @dev: current time is last block's timestamp. This resolves any client time-zone discrepancies,
     *  but on local ganache, note that the time doesn't advance unless you mine transactions.
     *
     * @param id object id to return a version for
     * @param delayPeriod - don't return entries younger than that (in seconds)
     * @param optInVersion - if set, return this version even if it is young
     * @return version info that include actual version used, its timestamp and value.
     */
    getVersion(id: string, delayPeriod: number, optInVersion?: string): Promise<VersionInfo>;
    /**
     * return all version history of the given id
     * @param id object id to return version history for
     */
    getAllVersions(id: string): Promise<VersionInfo[]>;
    listIds(): Promise<string[]>;
    addVersion(id: string, version: string, value: string, transactionDetails: TransactionDetails): Promise<void>;
    cancelVersion(id: string, version: string, cancelReason: string, transactionDetails: TransactionDetails): Promise<void>;
    private checkVersion;
}
