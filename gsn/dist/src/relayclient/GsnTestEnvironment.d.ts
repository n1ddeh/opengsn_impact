import { HttpServer } from '../relayserver/HttpServer';
import { Address } from '../common/types/Aliases';
import { RelayProvider } from './RelayProvider';
import { GSNContractsDeployment } from '../common/GSNContractsDeployment';
export interface TestEnvironment {
    contractsDeployment: GSNContractsDeployment;
    relayProvider: RelayProvider;
    httpServer: HttpServer;
    relayUrl: string;
}
declare class GsnTestEnvironmentClass {
    private httpServer?;
    /**
     *
     * @param host:
     * @return
     */
    startGsn(host: string): Promise<TestEnvironment>;
    /**
     * initialize a local relay
     * @private
     */
    private _resolveAvailablePort;
    stopGsn(): Promise<void>;
    _runServer(host: string, deploymentResult: GSNContractsDeployment, from: Address, relayUrl: string, port: number): Promise<void>;
    /**
     * return deployment saved by "gsn start"
     * @param workdir
     */
    loadDeployment(workdir?: string): GSNContractsDeployment;
}
export declare const GsnTestEnvironment: GsnTestEnvironmentClass;
export {};
