"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// TODO: convert to 'commander' format
const fs_1 = __importDefault(require("fs"));
const web3_1 = __importDefault(require("web3"));
const HttpServer_1 = require("./HttpServer");
const RelayServer_1 = require("./RelayServer");
const KeyManager_1 = require("./KeyManager");
const TxStoreManager_1 = require("./TxStoreManager");
const ContractInteractor_1 = __importDefault(require("../common/ContractInteractor"));
const ServerConfigParams_1 = require("./ServerConfigParams");
const ServerWinstonLogger_1 = require("./ServerWinstonLogger");
const PenalizerService_1 = require("./penalizer/PenalizerService");
const TransactionManager_1 = require("./TransactionManager");
const EtherscanCachedService_1 = require("./penalizer/EtherscanCachedService");
const TransactionDataCache_1 = require("./penalizer/TransactionDataCache");
const GasPriceFetcher_1 = require("../relayclient/GasPriceFetcher");
const ReputationManager_1 = require("./ReputationManager");
const ReputationStoreManager_1 = require("./ReputationStoreManager");
function error(err) {
    console.error(err);
    process.exit(1);
}
async function run() {
    let config;
    let web3provider;
    let runPenalizer;
    let reputationManagerConfig;
    let runPaymasterReputations;
    console.log('Starting GSN Relay Server process...\n');
    try {
        const conf = await ServerConfigParams_1.parseServerConfig(process.argv.slice(2), process.env);
        if (conf.ethereumNodeUrl == null) {
            error('missing ethereumNodeUrl');
        }
        web3provider = new web3_1.default.providers.HttpProvider(conf.ethereumNodeUrl);
        config = await ServerConfigParams_1.resolveServerConfig(conf, web3provider);
        runPenalizer = config.runPenalizer;
        reputationManagerConfig = ServerConfigParams_1.resolveReputationManagerConfig(conf);
        runPaymasterReputations = config.runPaymasterReputations;
    }
    catch (e) {
        error(e.message);
    }
    const { devMode, workdir } = config;
    if (devMode) {
        if (fs_1.default.existsSync(`${workdir}/${TxStoreManager_1.TXSTORE_FILENAME}`)) {
            fs_1.default.unlinkSync(`${workdir}/${TxStoreManager_1.TXSTORE_FILENAME}`);
        }
        if (fs_1.default.existsSync(`${workdir}/${ReputationStoreManager_1.REPUTATION_STORE_FILENAME}`)) {
            fs_1.default.unlinkSync(`${workdir}/${ReputationStoreManager_1.REPUTATION_STORE_FILENAME}`);
        }
        if (fs_1.default.existsSync(`${workdir}/${TransactionDataCache_1.TX_STORE_FILENAME}`)) {
            fs_1.default.unlinkSync(`${workdir}/${TransactionDataCache_1.TX_STORE_FILENAME}`);
        }
        if (fs_1.default.existsSync(`${workdir}/${TransactionDataCache_1.TX_PAGES_FILENAME}`)) {
            fs_1.default.unlinkSync(`${workdir}/${TransactionDataCache_1.TX_PAGES_FILENAME}`);
        }
    }
    const logger = ServerWinstonLogger_1.createServerLogger(config.logLevel, config.loggerUrl, config.loggerUserId);
    const managerKeyManager = new KeyManager_1.KeyManager(1, workdir + '/manager');
    const workersKeyManager = new KeyManager_1.KeyManager(1, workdir + '/workers');
    const txStoreManager = new TxStoreManager_1.TxStoreManager({ workdir }, logger);
    const contractInteractor = new ContractInteractor_1.default({
        provider: web3provider,
        logger,
        deployment: { relayHubAddress: config.relayHubAddress }
    });
    await contractInteractor.init();
    const gasPriceFetcher = new GasPriceFetcher_1.GasPriceFetcher(config.gasPriceOracleUrl, config.gasPriceOraclePath, contractInteractor, logger);
    let reputationManager;
    if (runPaymasterReputations) {
        const reputationStoreManager = new ReputationStoreManager_1.ReputationStoreManager({ workdir, inMemory: true }, logger);
        reputationManager = new ReputationManager_1.ReputationManager(reputationStoreManager, logger, reputationManagerConfig);
    }
    const dependencies = {
        logger,
        txStoreManager,
        reputationManager,
        managerKeyManager,
        workersKeyManager,
        contractInteractor,
        gasPriceFetcher
    };
    const transactionManager = new TransactionManager_1.TransactionManager(dependencies, config);
    let penalizerService;
    if (runPenalizer) {
        const transactionDataCache = new TransactionDataCache_1.TransactionDataCache(logger, config.workdir);
        const txByNonceService = new EtherscanCachedService_1.EtherscanCachedService(config.etherscanApiUrl, config.etherscanApiKey, logger, transactionDataCache);
        const penalizerParams = {
            transactionManager,
            contractInteractor,
            txByNonceService
        };
        penalizerService = new PenalizerService_1.PenalizerService(penalizerParams, logger, config);
        await penalizerService.init();
    }
    const relay = new RelayServer_1.RelayServer(config, transactionManager, dependencies);
    await relay.init();
    const httpServer = new HttpServer_1.HttpServer(config.port, logger, relay, penalizerService);
    httpServer.start();
}
// eslint-disable-next-line @typescript-eslint/no-floating-promises
run();
//# sourceMappingURL=runServer.js.map