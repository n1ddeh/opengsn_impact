"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-ignore
const console_read_write_1 = __importDefault(require("console-read-write"));
const bn_js_1 = __importDefault(require("bn.js"));
const hdwallet_provider_1 = __importDefault(require("@truffle/hdwallet-provider"));
const web3_1 = __importDefault(require("web3"));
const web3_utils_1 = require("web3-utils");
const lodash_1 = require("lodash");
const Utils_1 = require("../common/Utils");
// compiled folder populated by "prepublish"
const StakeManager_json_1 = __importDefault(require("./compiled/StakeManager.json"));
const RelayHub_json_1 = __importDefault(require("./compiled/RelayHub.json"));
const Penalizer_json_1 = __importDefault(require("./compiled/Penalizer.json"));
const TestPaymasterEverythingAccepted_json_1 = __importDefault(require("./compiled/TestPaymasterEverythingAccepted.json"));
const Forwarder_json_1 = __importDefault(require("./compiled/Forwarder.json"));
const VersionRegistry_json_1 = __importDefault(require("./compiled/VersionRegistry.json"));
const ContractInteractor_1 = __importDefault(require("../common/ContractInteractor"));
const HttpClient_1 = __importDefault(require("../relayclient/HttpClient"));
const Constants_1 = require("../common/Constants");
const VersionRegistry_1 = require("../common/VersionRegistry");
const ForwarderUtil_1 = require("../common/EIP712/ForwarderUtil");
const HttpWrapper_1 = __importDefault(require("../relayclient/HttpWrapper"));
require('source-map-support').install({ errorFormatterForce: true });
class CommandsLogic {
    constructor(host, logger, deployment, mnemonic) {
        let provider = new web3_1.default.providers.HttpProvider(host);
        if (mnemonic != null) {
            // web3 defines provider type quite narrowly
            provider = new hdwallet_provider_1.default(mnemonic, provider);
        }
        this.httpClient = new HttpClient_1.default(new HttpWrapper_1.default(), logger);
        this.contractInteractor = new ContractInteractor_1.default({ provider, logger, deployment });
        this.deployment = deployment;
        this.web3 = new web3_1.default(provider);
    }
    async init() {
        await this.contractInteractor.init();
        return this;
    }
    async findWealthyAccount(requiredBalance = Utils_1.ether('2')) {
        let accounts = [];
        try {
            accounts = await this.web3.eth.getAccounts();
            for (const account of accounts) {
                const balance = new bn_js_1.default(await this.web3.eth.getBalance(account));
                if (balance.gte(requiredBalance)) {
                    console.log(`Found funded account ${account}`);
                    return account;
                }
            }
        }
        catch (error) {
            console.error('Failed to retrieve accounts and balances:', error);
        }
        throw new Error(`could not find unlocked account with sufficient balance; all accounts:\n - ${accounts.join('\n - ')}`);
    }
    async isRelayReady(relayUrl) {
        const response = await this.httpClient.getPingResponse(relayUrl);
        return response.ready;
    }
    async waitForRelay(relayUrl, timeout = 60) {
        console.error(`Will wait up to ${timeout}s for the relay to be ready`);
        const endTime = Date.now() + timeout * 1000;
        while (Date.now() < endTime) {
            let isReady = false;
            try {
                isReady = await this.isRelayReady(relayUrl);
            }
            catch (e) {
                console.log(e.message);
            }
            if (isReady) {
                return;
            }
            await Utils_1.sleep(3000);
        }
        throw Error(`Relay not ready after ${timeout}s`);
    }
    async getPaymasterBalance(paymaster) {
        if (this.deployment == null) {
            throw new Error('Deployment is not initialized!');
        }
        return await this.contractInteractor.hubBalanceOf(paymaster);
    }
    /**
     * Send enough ether from the {@param from} to the RelayHub to make {@param paymaster}'s gas deposit exactly {@param amount}.
     * Does nothing if current paymaster balance exceeds amount.
     * @param from
     * @param paymaster
     * @param amount
     * @return deposit of the paymaster after
     */
    async fundPaymaster(from, paymaster, amount) {
        if (this.deployment == null) {
            throw new Error('Deployment is not initialized!');
        }
        const currentBalance = await this.contractInteractor.hubBalanceOf(paymaster);
        const targetAmount = new bn_js_1.default(amount);
        if (currentBalance.lt(targetAmount)) {
            const value = targetAmount.sub(currentBalance);
            await this.contractInteractor.hubDepositFor(paymaster, {
                value,
                from
            });
            return targetAmount;
        }
        else {
            return currentBalance;
        }
    }
    async registerRelay(options) {
        const transactions = [];
        try {
            console.log(`Registering GSN relayer at ${options.relayUrl}`);
            const response = await this.httpClient.getPingResponse(options.relayUrl)
                .catch(() => { throw new Error('could contact not relayer, is it running?'); });
            if (response.ready) {
                return {
                    success: false,
                    error: 'Nothing to do. Relayer already registered'
                };
            }
            const chainId = this.contractInteractor.chainId;
            if (response.chainId !== chainId.toString()) {
                throw new Error(`wrong chain-id: Relayer on (${response.chainId}) but our provider is on (${chainId})`);
            }
            const relayAddress = response.relayManagerAddress;
            const relayHubAddress = response.relayHubAddress;
            const relayHub = await this.contractInteractor._createRelayHub(relayHubAddress);
            const stakeManagerAddress = await relayHub.stakeManager();
            const stakeManager = await this.contractInteractor._createStakeManager(stakeManagerAddress);
            const { stake, unstakeDelay, owner } = await stakeManager.getStakeInfo(relayAddress);
            console.log('current stake=', web3_utils_1.fromWei(stake, 'ether'));
            if (owner !== Constants_1.constants.ZERO_ADDRESS && !Utils_1.isSameAddress(owner, options.from)) {
                throw new Error(`Already owned by ${owner}, our account=${options.from}`);
            }
            if (web3_utils_1.toBN(unstakeDelay).gte(web3_utils_1.toBN(options.unstakeDelay)) &&
                web3_utils_1.toBN(stake).gte(web3_utils_1.toBN(options.stake.toString()))) {
                console.log('Relayer already staked');
            }
            else {
                const stakeValue = web3_utils_1.toBN(options.stake.toString()).sub(web3_utils_1.toBN(stake));
                console.log(`Staking relayer ${web3_utils_1.fromWei(stakeValue, 'ether')} eth`, stake === '0' ? '' : ` (already has ${web3_utils_1.fromWei(stake, 'ether')} eth)`);
                const stakeTx = await stakeManager
                    .stakeForAddress(relayAddress, options.unstakeDelay.toString(), {
                    value: stakeValue,
                    from: options.from,
                    gas: 1e6,
                    gasPrice: options.gasPrice
                });
                transactions.push(stakeTx.tx);
            }
            if (Utils_1.isSameAddress(owner, options.from)) {
                console.log('Relayer already authorized');
            }
            else {
                console.log('Authorizing relayer for hub');
                const authorizeTx = await stakeManager
                    .authorizeHubByOwner(relayAddress, relayHubAddress, {
                    from: options.from,
                    gas: 1e6,
                    gasPrice: options.gasPrice
                });
                transactions.push(authorizeTx.tx);
            }
            const bal = await this.contractInteractor.getBalance(relayAddress);
            if (web3_utils_1.toBN(bal).gt(web3_utils_1.toBN(options.funds.toString()))) {
                console.log('Relayer already funded');
            }
            else {
                console.log('Funding relayer');
                const _fundTx = await this.web3.eth.sendTransaction({
                    from: options.from,
                    to: relayAddress,
                    value: options.funds,
                    gas: 1e6,
                    gasPrice: options.gasPrice
                });
                const fundTx = _fundTx;
                if (fundTx.transactionHash == null) {
                    return {
                        success: false,
                        error: `Fund transaction reverted: ${JSON.stringify(_fundTx)}`
                    };
                }
                transactions.push(fundTx.transactionHash);
            }
            await this.waitForRelay(options.relayUrl);
            return {
                success: true,
                transactions
            };
        }
        catch (error) {
            return {
                success: false,
                transactions,
                // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                error: error.message
            };
        }
    }
    contract(file, address) {
        return new this.web3.eth.Contract(file.abi, address, { data: file.bytecode });
    }
    async deployGsnContracts(deployOptions) {
        var _a, _b;
        const options = {
            from: deployOptions.from,
            gas: 0,
            value: 0,
            gasPrice: (_a = deployOptions.gasPrice) !== null && _a !== void 0 ? _a : (1e9).toString()
        };
        const sInstance = await this.getContractInstance(StakeManager_json_1.default, {}, deployOptions.stakeManagerAddress, Object.assign({}, options), deployOptions.skipConfirmation);
        const pInstance = await this.getContractInstance(Penalizer_json_1.default, {}, deployOptions.penalizerAddress, Object.assign({}, options), deployOptions.skipConfirmation);
        const fInstance = await this.getContractInstance(Forwarder_json_1.default, {}, deployOptions.forwarderAddress, Object.assign({}, options), deployOptions.skipConfirmation);
        const rInstance = await this.getContractInstance(RelayHub_json_1.default, {
            arguments: [
                sInstance.options.address,
                pInstance.options.address,
                deployOptions.relayHubConfiguration.maxWorkerCount,
                deployOptions.relayHubConfiguration.gasReserve,
                deployOptions.relayHubConfiguration.postOverhead,
                deployOptions.relayHubConfiguration.gasOverhead,
                deployOptions.relayHubConfiguration.maximumRecipientDeposit,
                deployOptions.relayHubConfiguration.minimumUnstakeDelay,
                deployOptions.relayHubConfiguration.minimumStake
            ]
        }, deployOptions.relayHubAddress, lodash_1.merge({}, options, { gas: 5e6 }), deployOptions.skipConfirmation);
        const regInstance = await this.getContractInstance(VersionRegistry_json_1.default, {}, deployOptions.registryAddress, Object.assign({}, options), deployOptions.skipConfirmation);
        if (deployOptions.registryHubId != null) {
            await regInstance.methods.addVersion(VersionRegistry_1.string32(deployOptions.registryHubId), VersionRegistry_1.string32('1'), rInstance.options.address).send({ from: deployOptions.from });
            console.log(`== Saved RelayHub address at HubId:"${deployOptions.registryHubId}" to VersionRegistry`);
        }
        let pmInstance;
        let paymasterVersion = '';
        if (deployOptions.deployPaymaster === true) {
            pmInstance = await this.deployPaymaster(Object.assign({}, options), rInstance.options.address, deployOptions.from, fInstance, deployOptions.skipConfirmation);
            paymasterVersion = await pmInstance.methods.versionPaymaster();
        }
        await ForwarderUtil_1.registerForwarderForGsn(fInstance, options);
        this.deployment = {
            paymasterVersion,
            relayHubAddress: rInstance.options.address,
            stakeManagerAddress: sInstance.options.address,
            penalizerAddress: pInstance.options.address,
            forwarderAddress: fInstance.options.address,
            versionRegistryAddress: regInstance.options.address,
            paymasterAddress: (_b = pmInstance === null || pmInstance === void 0 ? void 0 : pmInstance.options.address) !== null && _b !== void 0 ? _b : Constants_1.constants.ZERO_ADDRESS
        };
        await this.contractInteractor.initDeployment(this.deployment);
        return this.deployment;
    }
    async getContractInstance(json, constructorArgs, address, options, skipConfirmation = false) {
        const contractName = json.contractName;
        let contractInstance;
        if (address == null) {
            const sendMethod = this
                .contract(json)
                .deploy(constructorArgs);
            options.gas = await sendMethod.estimateGas();
            const maxCost = new bn_js_1.default(options.gasPrice).muln(options.gas);
            const oneEther = Utils_1.ether('1');
            console.log(`Deploying ${contractName} contract with gas limit of ${options.gas.toLocaleString()} and maximum cost of ~ ${maxCost.toNumber() / parseFloat(oneEther.toString())} ETH`);
            if (!skipConfirmation) {
                await this.confirm();
            }
            const deployPromise = sendMethod.send(lodash_1.merge(options, { gas: 5e6 }));
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            deployPromise.on('transactionHash', function (hash) {
                console.log(`Transaction broadcast: ${hash}`);
            });
            contractInstance = await deployPromise;
            console.log(`Deployed ${contractName} at address ${contractInstance.options.address}\n\n`);
        }
        else {
            console.log(`Using ${contractName} at given address ${address}\n\n`);
            contractInstance = this.contract(json, address);
        }
        return contractInstance;
    }
    async deployPaymaster(options, hub, from, fInstance, skipConfirmation) {
        const pmInstance = await this.getContractInstance(TestPaymasterEverythingAccepted_json_1.default, {}, undefined, Object.assign({}, options), skipConfirmation);
        await pmInstance.methods.setRelayHub(hub).send(options);
        await pmInstance.methods.setTrustedForwarder(fInstance.options.address).send(options);
        return pmInstance;
    }
    async confirm() {
        let input;
        while (true) {
            console.log('Confirm (yes/no)?');
            input = await console_read_write_1.default.read();
            if (input === 'yes') {
                return;
            }
            else if (input === 'no') {
                throw new Error('User rejected');
            }
        }
    }
}
exports.default = CommandsLogic;
//# sourceMappingURL=CommandsLogic.js.map