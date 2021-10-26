"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// TODO: allow reading network URLs from 'truffle-config.js'
const commander_1 = __importDefault(require("commander"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const cliInfuraId = '$INFURA_ID';
exports.networks = new Map([
    ['localhost', 'http://127.0.0.1:8545'],
    ['xdai', 'https://dai.poa.network'],
    ['ropsten', 'https://ropsten.infura.io/v3/' + cliInfuraId],
    ['rinkeby', 'https://rinkeby.infura.io/v3/' + cliInfuraId],
    ['kovan', 'https://kovan.infura.io/v3/' + cliInfuraId],
    ['goerli', 'https://goerli.infura.io/v3/' + cliInfuraId],
    ['mainnet', 'https://mainnet.infura.io/v3/' + cliInfuraId]
]);
function supportedNetworks() {
    return Array.from(exports.networks.keys());
}
exports.supportedNetworks = supportedNetworks;
function getNetworkUrl(network, env = process.env) {
    var _a, _b;
    const net = exports.networks.get(network);
    if (net == null) {
        const match = (_a = network.match(/^(https?:\/\/.*)/)) !== null && _a !== void 0 ? _a : [];
        return match[0];
    }
    if (net.includes('$INFURA_ID')) {
        const str = (_b = env.INFURA_ID) !== null && _b !== void 0 ? _b : '';
        if (str === '') {
            throw new Error(`network ${network}: INFURA_ID not set`);
        }
        return net.replace(/\$INFURA_ID/, str);
    }
    return net;
}
exports.getNetworkUrl = getNetworkUrl;
function getMnemonic(mnemonicFile) {
    if (mnemonicFile == null) {
        return;
    }
    console.log('Using mnemonic from file ' + mnemonicFile);
    return fs_1.default.readFileSync(mnemonicFile, { encoding: 'utf8' }).replace(/\r?\n|\r/g, '');
}
exports.getMnemonic = getMnemonic;
function getRelayHubConfiguration(configFile) {
    if (configFile == null) {
        return;
    }
    console.log('Using hub config from file ' + configFile);
    const file = fs_1.default.readFileSync(configFile, { encoding: 'utf8' });
    return JSON.parse(file);
}
exports.getRelayHubConfiguration = getRelayHubConfiguration;
function getPaymasterAddress(paymaster) {
    return getAddressFromFile('build/gsn/Paymaster.json', paymaster);
}
exports.getPaymasterAddress = getPaymasterAddress;
function getRelayHubAddress(defaultAddress) {
    return getAddressFromFile('build/gsn/RelayHub.json', defaultAddress);
}
exports.getRelayHubAddress = getRelayHubAddress;
function getRegistryAddress(defaultAddress) {
    return getAddressFromFile('build/gsn/VersionRegistry.json', defaultAddress);
}
exports.getRegistryAddress = getRegistryAddress;
function getAddressFromFile(path, defaultAddress) {
    if (defaultAddress == null) {
        if (fs_1.default.existsSync(path)) {
            const relayHubDeployInfo = fs_1.default.readFileSync(path).toString();
            return JSON.parse(relayHubDeployInfo).address;
        }
    }
    return defaultAddress;
}
function saveContractToFile(address, workdir, filename) {
    if (address == null) {
        throw new Error('Address is not initialized!');
    }
    fs_1.default.mkdirSync(workdir, { recursive: true });
    fs_1.default.writeFileSync(path_1.default.join(workdir, filename), `{ "address": "${address}" }`);
}
function saveDeployment(deploymentResult, workdir) {
    saveContractToFile(deploymentResult.stakeManagerAddress, workdir, 'StakeManager.json');
    saveContractToFile(deploymentResult.penalizerAddress, workdir, 'Penalizer.json');
    saveContractToFile(deploymentResult.relayHubAddress, workdir, 'RelayHub.json');
    saveContractToFile(deploymentResult.paymasterAddress, workdir, 'Paymaster.json');
    saveContractToFile(deploymentResult.forwarderAddress, workdir, 'Forwarder.json');
    saveContractToFile(deploymentResult.versionRegistryAddress, workdir, 'VersionRegistry.json');
}
exports.saveDeployment = saveDeployment;
function showDeployment(deploymentResult, title, paymasterTitle = undefined) {
    if (title != null) {
        console.log(title);
    }
    console.log(`
  RelayHub: ${deploymentResult.relayHubAddress}
  StakeManager: ${deploymentResult.stakeManagerAddress}
  Penalizer: ${deploymentResult.penalizerAddress}
  VersionRegistry: ${deploymentResult.versionRegistryAddress}
  Forwarder: ${deploymentResult.forwarderAddress}
  Paymaster ${paymasterTitle != null ? '(' + paymasterTitle + ')' : ''}: ${deploymentResult.paymasterAddress}`);
}
exports.showDeployment = showDeployment;
function loadDeployment(workdir) {
    function getAddress(name) {
        return getAddressFromFile(path_1.default.join(workdir, name + '.json'));
    }
    return {
        relayHubAddress: getAddress('RelayHub'),
        stakeManagerAddress: getAddress('StakeManager'),
        penalizerAddress: getAddress('Penalizer'),
        forwarderAddress: getAddress('Forwarder'),
        versionRegistryAddress: getAddress('VersionRegistry'),
        paymasterAddress: getAddress('Paymaster')
    };
}
exports.loadDeployment = loadDeployment;
function gsnCommander(options) {
    options.forEach(option => {
        switch (option) {
            case 'n':
                commander_1.default.option('-n, --network <url|name>', 'network name or URL to an Ethereum node', 'localhost');
                break;
            case 'f':
                commander_1.default.option('-f, --from <address>', 'account to send transactions from (default: the first account with balance)');
                break;
            case 'h':
                commander_1.default.option('-h, --hub <address>', 'address of the hub contract (default: the address from build/gsn/RelayHub.json if exists)');
                break;
            case 'm':
                commander_1.default.option('-m, --mnemonic <mnemonic>', 'mnemonic file to generate private key for account \'from\' (default: empty)');
                break;
            case 'g':
                commander_1.default.option('-g, --gasPrice <number>', 'gas price to give to the transaction, in gwei.', '1');
                break;
        }
    });
    commander_1.default.option('-l, --loglevel <string>', 'error | warn | info | debug', 'debug');
    return commander_1.default;
}
exports.gsnCommander = gsnCommander;
//# sourceMappingURL=utils.js.map