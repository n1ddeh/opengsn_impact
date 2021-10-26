"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const minimist_1 = __importDefault(require("minimist"));
const VersionRegistry_1 = require("../common/VersionRegistry");
const ContractInteractor_1 = __importDefault(require("../common/ContractInteractor"));
const Constants_1 = require("../common/Constants");
const ServerWinstonLogger_1 = require("./ServerWinstonLogger");
require('source-map-support').install({ errorFormatterForce: true });
const serverDefaultConfiguration = {
    alertedBlockDelay: 0,
    minAlertedDelayMS: 0,
    maxAlertedDelayMS: 0,
    maxAcceptanceBudget: 2e5,
    relayHubAddress: Constants_1.constants.ZERO_ADDRESS,
    trustedPaymasters: [],
    gasPriceFactor: 1,
    gasPriceOracleUrl: '',
    gasPriceOraclePath: '',
    registrationBlockRate: 0,
    workerMinBalance: 0.1e18,
    workerTargetBalance: 0.3e18,
    managerMinBalance: 0.1e18,
    managerMinStake: '1',
    managerTargetBalance: 0.3e18,
    minHubWithdrawalBalance: 0.1e18,
    checkInterval: 10000,
    readyTimeout: 30000,
    devMode: false,
    runPenalizer: true,
    logLevel: 'debug',
    loggerUrl: '',
    etherscanApiUrl: '',
    etherscanApiKey: '',
    loggerUserId: '',
    baseRelayFee: '0',
    pctRelayFee: 0,
    url: 'http://localhost:8090',
    ethereumNodeUrl: '',
    port: 0,
    versionRegistryAddress: Constants_1.constants.ZERO_ADDRESS,
    workdir: '',
    refreshStateTimeoutBlocks: 5,
    pendingTransactionTimeoutBlocks: 30,
    successfulRoundsForReady: 3,
    confirmationsNeeded: 12,
    retryGasPriceFactor: 1.2,
    defaultGasLimit: 500000,
    maxGasPrice: 100e9.toString(),
    runPaymasterReputations: true
};
const ConfigParamsTypes = {
    config: 'string',
    baseRelayFee: 'number',
    pctRelayFee: 'number',
    url: 'string',
    port: 'number',
    versionRegistryAddress: 'string',
    versionRegistryDelayPeriod: 'number',
    relayHubId: 'string',
    relayHubAddress: 'string',
    gasPriceFactor: 'number',
    gasPriceOracleUrl: 'string',
    gasPriceOraclePath: 'string',
    ethereumNodeUrl: 'string',
    workdir: 'string',
    checkInterval: 'number',
    readyTimeout: 'number',
    devMode: 'boolean',
    logLevel: 'string',
    loggerUrl: 'string',
    loggerUserId: 'string',
    customerToken: 'string',
    hostOverride: 'string',
    userId: 'string',
    registrationBlockRate: 'number',
    maxAcceptanceBudget: 'number',
    alertedBlockDelay: 'number',
    workerMinBalance: 'number',
    workerTargetBalance: 'number',
    managerMinBalance: 'number',
    managerTargetBalance: 'number',
    minHubWithdrawalBalance: 'number',
    defaultGasLimit: 'number',
    trustedPaymasters: 'list',
    runPenalizer: 'boolean',
    etherscanApiUrl: 'string',
    etherscanApiKey: 'string',
    // TODO: does not belong here
    initialReputation: 'number'
};
// by default: no waiting period - use VersionRegistry entries immediately.
const DefaultRegistryDelayPeriod = 0;
// helper function: throw and never return..
function error(err) {
    throw new Error(err);
}
// get the keys matching specific type from ConfigParamsType
function filterType(config, type) {
    return Object.entries(config).flatMap(e => e[1] === type ? [e[0]] : []);
}
exports.filterType = filterType;
// convert [key,val] array (created by Object.entries) back to an object.
function entriesToObj(entries) {
    return entries
        .reduce((set, [k, v]) => (Object.assign(Object.assign({}, set), { [k]: v })), {});
}
exports.entriesToObj = entriesToObj;
// filter and return from env only members that appear in "config"
function filterMembers(env, config) {
    return entriesToObj(Object.entries(env)
        .filter(e => config[e[0]] != null));
}
exports.filterMembers = filterMembers;
// map value from string into its explicit type (number, boolean)
// TODO; maybe we can use it for more specific types, such as "address"..
function explicitType([key, val]) {
    const type = ConfigParamsTypes[key];
    if (type === undefined) {
        error(`unexpected param ${key}=${val}`);
    }
    switch (type) {
        case 'boolean':
            if (val === 'true' || val === true)
                return [key, true];
            if (val === 'false' || val === false)
                return [key, false];
            break;
        case 'number': {
            const v = parseInt(val);
            if (!isNaN(v)) {
                return [key, v];
            }
            break;
        }
        default:
            return [key, val];
    }
    error(`Invalid ${type}: ${key} = ${val}`);
}
/**
 * initialize each parameter from commandline, env or config file (in that order)
 * config file must be provided either as command-line or env (obviously, not in
 * the config file..)
 */
function parseServerConfig(args, env) {
    const envDefaults = filterMembers(env, ConfigParamsTypes);
    const argv = minimist_1.default(args, {
        string: filterType(ConfigParamsTypes, 'string'),
        // boolean: filterType(ConfigParamsTypes, 'boolean'),
        default: envDefaults
    });
    if (argv._.length > 0) {
        error(`unexpected param(s) ${argv._.join(',')}`);
    }
    delete argv._;
    let configFile = {};
    const configFileName = argv.config;
    if (configFileName != null) {
        if (!fs.existsSync(configFileName)) {
            error(`unable to read config file "${configFileName}"`);
        }
        configFile = JSON.parse(fs.readFileSync(configFileName, 'utf8'));
    }
    const config = Object.assign(Object.assign({}, configFile), argv);
    return entriesToObj(Object.entries(config).map(explicitType));
}
exports.parseServerConfig = parseServerConfig;
// resolve params, and validate the resulting struct
async function resolveServerConfig(config, web3provider) {
    var _a, _b, _c, _d, _e;
    // TODO: avoid functions that are not parts of objects! Refactor this so there is a configured logger before we start blockchain interactions.
    const logger = ServerWinstonLogger_1.createServerLogger((_a = config.logLevel) !== null && _a !== void 0 ? _a : 'debug', (_b = config.loggerUrl) !== null && _b !== void 0 ? _b : '', (_c = config.loggerUserId) !== null && _c !== void 0 ? _c : '');
    const contractInteractor = new ContractInteractor_1.default({
        provider: web3provider,
        logger,
        deployment: { relayHubAddress: config.relayHubAddress }
    });
    if (config.versionRegistryAddress != null) {
        if (config.relayHubAddress != null) {
            error('missing param: must have either relayHubAddress or versionRegistryAddress');
        }
        const relayHubId = (_d = config.relayHubId) !== null && _d !== void 0 ? _d : error('missing param: relayHubId to read from VersionRegistry');
        contractInteractor.validateAddress(config.versionRegistryAddress, 'Invalid param versionRegistryAddress: ');
        if (!await contractInteractor.isContractDeployed(config.versionRegistryAddress)) {
            error('Invalid param versionRegistryAddress: no contract at address ' + config.versionRegistryAddress);
        }
        const versionRegistry = new VersionRegistry_1.VersionRegistry(web3provider, config.versionRegistryAddress);
        const { version, value, time } = await versionRegistry.getVersion(relayHubId, (_e = config.versionRegistryDelayPeriod) !== null && _e !== void 0 ? _e : DefaultRegistryDelayPeriod);
        contractInteractor.validateAddress(value, `Invalid param relayHubId ${relayHubId} @ ${version}: not an address:`);
        console.log(`Using RelayHub ID:${relayHubId} version:${version} address:${value} . created at: ${new Date(time * 1000).toString()}`);
        config.relayHubAddress = value;
    }
    else {
        if (config.relayHubAddress == null) {
            error('missing param: must have either relayHubAddress or versionRegistryAddress');
        }
        contractInteractor.validateAddress(config.relayHubAddress, 'invalid param: "relayHubAddress" is not a valid address:');
    }
    if (!await contractInteractor.isContractDeployed(config.relayHubAddress)) {
        error(`RelayHub: no contract at address ${config.relayHubAddress}`);
    }
    if (config.url == null)
        error('missing param: url');
    if (config.workdir == null)
        error('missing param: workdir');
    return Object.assign(Object.assign({}, serverDefaultConfiguration), config);
}
exports.resolveServerConfig = resolveServerConfig;
function resolveReputationManagerConfig(config) {
    if (config.configFileName != null) {
        if (!fs.existsSync(config.configFileName)) {
            error(`unable to read config file "${config.configFileName}"`);
        }
        return JSON.parse(fs.readFileSync(config.configFileName, 'utf8'));
    }
    // TODO: something not insane!
    return config;
}
exports.resolveReputationManagerConfig = resolveReputationManagerConfig;
function configureServer(partialConfig) {
    return Object.assign({}, serverDefaultConfiguration, partialConfig);
}
exports.configureServer = configureServer;
//# sourceMappingURL=ServerConfigParams.js.map