"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const net_1 = __importDefault(require("net"));
const Utils_1 = require("../common/Utils");
const CommandsLogic_1 = __importDefault(require("../cli/CommandsLogic"));
const KeyManager_1 = require("../relayserver/KeyManager");
const utils_1 = require("../cli/utils");
const TxStoreManager_1 = require("../relayserver/TxStoreManager");
const RelayServer_1 = require("../relayserver/RelayServer");
const HttpServer_1 = require("../relayserver/HttpServer");
const RelayProvider_1 = require("./RelayProvider");
const web3_1 = __importDefault(require("web3"));
const ContractInteractor_1 = __importDefault(require("../common/ContractInteractor"));
const Environments_1 = require("../common/Environments");
const ServerConfigParams_1 = require("../relayserver/ServerConfigParams");
const ServerWinstonLogger_1 = require("../relayserver/ServerWinstonLogger");
const TransactionManager_1 = require("../relayserver/TransactionManager");
const GasPriceFetcher_1 = require("./GasPriceFetcher");
class GsnTestEnvironmentClass {
    /**
     *
     * @param host:
     * @return
     */
    async startGsn(host) {
        var _a;
        await this.stopGsn();
        const _host = utils_1.getNetworkUrl(host);
        if (_host == null) {
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            throw new Error(`startGsn: expected network (${utils_1.supportedNetworks().join('|')}) or url`);
        }
        const logger = ServerWinstonLogger_1.createServerLogger('error', '', '');
        const commandsLogic = new CommandsLogic_1.default(_host, logger, {});
        await commandsLogic.init();
        const from = await commandsLogic.findWealthyAccount();
        const deploymentResult = await commandsLogic.deployGsnContracts({
            from,
            gasPrice: '1',
            deployPaymaster: true,
            skipConfirmation: true,
            relayHubConfiguration: Environments_1.defaultEnvironment.relayHubConfiguration
        });
        if (deploymentResult.paymasterAddress != null) {
            const balance = await commandsLogic.fundPaymaster(from, deploymentResult.paymasterAddress, Utils_1.ether('1'));
            console.log('Naive Paymaster successfully funded, balance:', web3_1.default.utils.fromWei(balance));
        }
        const port = await this._resolveAvailablePort();
        const relayUrl = 'http://127.0.0.1:' + port.toString();
        await this._runServer(_host, deploymentResult, from, relayUrl, port);
        if (this.httpServer == null) {
            throw new Error('Failed to run a local Relay Server');
        }
        const registerOptions = {
            from,
            stake: Utils_1.ether('1'),
            funds: Utils_1.ether('1'),
            relayUrl: relayUrl,
            gasPrice: '1e9',
            unstakeDelay: '2000'
        };
        const registrationResult = await commandsLogic.registerRelay(registerOptions);
        if (registrationResult.success) {
            console.log('In-process relay successfully registered:', JSON.stringify(registrationResult));
        }
        else {
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            throw new Error(`Failed to fund relay: ${registrationResult.error} : ${(_a = registrationResult === null || registrationResult === void 0 ? void 0 : registrationResult.transactions) === null || _a === void 0 ? void 0 : _a.toString()}`);
        }
        await commandsLogic.waitForRelay(relayUrl);
        const config = {
            preferredRelays: [relayUrl],
            paymasterAddress: deploymentResult.paymasterAddress
        };
        const provider = new web3_1.default.providers.HttpProvider(_host);
        const input = {
            provider,
            config
        };
        const relayProvider = await RelayProvider_1.RelayProvider.newProvider(input).init();
        console.error('== startGSN: ready.');
        return {
            contractsDeployment: deploymentResult,
            relayProvider,
            relayUrl,
            httpServer: this.httpServer
        };
    }
    /**
     * initialize a local relay
     * @private
     */
    async _resolveAvailablePort() {
        const server = net_1.default.createServer();
        await new Promise(resolve => {
            server.listen(0, resolve);
        });
        const address = server.address();
        if (address == null || typeof address === 'string') {
            throw new Error('Could not find available port');
        }
        const relayListenPort = address.port;
        server.close();
        return relayListenPort;
    }
    async stopGsn() {
        var _a;
        if (this.httpServer !== undefined) {
            this.httpServer.stop();
            this.httpServer.close();
            await ((_a = this.httpServer.relayService) === null || _a === void 0 ? void 0 : _a.transactionManager.txStoreManager.clearAll());
            this.httpServer = undefined;
        }
    }
    async _runServer(host, deploymentResult, from, relayUrl, port) {
        if (this.httpServer !== undefined) {
            return;
        }
        const logger = ServerWinstonLogger_1.createServerLogger('error', '', '');
        const managerKeyManager = new KeyManager_1.KeyManager(1);
        const workersKeyManager = new KeyManager_1.KeyManager(1);
        const txStoreManager = new TxStoreManager_1.TxStoreManager({ inMemory: true }, logger);
        const contractInteractor = new ContractInteractor_1.default({
            provider: new web3_1.default.providers.HttpProvider(host),
            logger,
            deployment: deploymentResult
        });
        await contractInteractor.init();
        const gasPriceFetcher = new GasPriceFetcher_1.GasPriceFetcher('', '', contractInteractor, logger);
        const relayServerDependencies = {
            logger,
            contractInteractor,
            gasPriceFetcher,
            txStoreManager,
            managerKeyManager,
            workersKeyManager
        };
        const relayServerParams = {
            devMode: true,
            url: relayUrl,
            relayHubAddress: deploymentResult.relayHubAddress,
            gasPriceFactor: 1,
            baseRelayFee: '0',
            pctRelayFee: 0,
            checkInterval: 10,
            runPaymasterReputations: false,
            logLevel: 'error'
        };
        const transactionManager = new TransactionManager_1.TransactionManager(relayServerDependencies, ServerConfigParams_1.configureServer(relayServerParams));
        const backend = new RelayServer_1.RelayServer(relayServerParams, transactionManager, relayServerDependencies);
        await backend.init();
        this.httpServer = new HttpServer_1.HttpServer(port, logger, backend);
        this.httpServer.start();
    }
    /**
     * return deployment saved by "gsn start"
     * @param workdir
     */
    loadDeployment(workdir = './build/gsn') {
        return utils_1.loadDeployment(workdir);
    }
}
exports.GsnTestEnvironment = new GsnTestEnvironmentClass();
//# sourceMappingURL=GsnTestEnvironment.js.map