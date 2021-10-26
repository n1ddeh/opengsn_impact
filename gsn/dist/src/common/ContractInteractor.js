"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bn_js_1 = __importDefault(require("bn.js"));
const web3_1 = __importDefault(require("web3"));
const web3_utils_1 = require("web3-utils");
const web3_eth_abi_1 = __importDefault(require("web3-eth-abi"));
const IPaymaster_json_1 = __importDefault(require("./interfaces/IPaymaster.json"));
const IRelayHub_json_1 = __importDefault(require("./interfaces/IRelayHub.json"));
const IForwarder_json_1 = __importDefault(require("./interfaces/IForwarder.json"));
const IStakeManager_json_1 = __importDefault(require("./interfaces/IStakeManager.json"));
const IPenalizer_json_1 = __importDefault(require("./interfaces/IPenalizer.json"));
const IRelayRecipient_json_1 = __importDefault(require("./interfaces/IRelayRecipient.json"));
const IKnowForwarderAddress_json_1 = __importDefault(require("./interfaces/IKnowForwarderAddress.json"));
const VersionsManager_1 = __importDefault(require("./VersionsManager"));
const ErrorReplacerJSON_1 = __importDefault(require("./ErrorReplacerJSON"));
const Utils_1 = require("./Utils");
const LightTruffleContract_1 = require("../relayclient/LightTruffleContract");
const Version_1 = require("./Version");
const ethereumjs_common_1 = __importDefault(require("ethereumjs-common"));
require('source-map-support').install({ errorFormatterForce: true });
exports.RelayServerRegistered = 'RelayServerRegistered';
exports.RelayWorkersAdded = 'RelayWorkersAdded';
exports.TransactionRelayed = 'TransactionRelayed';
exports.TransactionRejectedByPaymaster = 'TransactionRejectedByPaymaster';
const ActiveManagerEvents = [exports.RelayServerRegistered, exports.RelayWorkersAdded, exports.TransactionRelayed, exports.TransactionRejectedByPaymaster];
exports.HubAuthorized = 'HubAuthorized';
exports.HubUnauthorized = 'HubUnauthorized';
exports.StakeAdded = 'StakeAdded';
exports.StakeUnlocked = 'StakeUnlocked';
exports.StakeWithdrawn = 'StakeWithdrawn';
exports.StakePenalized = 'StakePenalized';
class ContractInteractor {
    constructor({ provider, versionManager, logger, deployment = {} }) {
        this.logger = logger;
        this.versionManager = versionManager !== null && versionManager !== void 0 ? versionManager : new VersionsManager_1.default(Version_1.gsnRuntimeVersion, Version_1.gsnRequiredVersion);
        this.web3 = new web3_1.default(provider);
        this.deployment = deployment;
        this.provider = provider;
        // @ts-ignore
        this.IPaymasterContract = LightTruffleContract_1.TruffleContract({
            contractName: 'IPaymaster',
            abi: IPaymaster_json_1.default
        });
        // @ts-ignore
        this.IRelayHubContract = LightTruffleContract_1.TruffleContract({
            contractName: 'IRelayHub',
            abi: IRelayHub_json_1.default
        });
        // @ts-ignore
        this.IForwarderContract = LightTruffleContract_1.TruffleContract({
            contractName: 'IForwarder',
            abi: IForwarder_json_1.default
        });
        // @ts-ignore
        this.IStakeManager = LightTruffleContract_1.TruffleContract({
            contractName: 'IStakeManager',
            abi: IStakeManager_json_1.default
        });
        // @ts-ignore
        this.IPenalizer = LightTruffleContract_1.TruffleContract({
            contractName: 'IPenalizer',
            abi: IPenalizer_json_1.default
        });
        // @ts-ignore
        this.IRelayRecipient = LightTruffleContract_1.TruffleContract({
            contractName: 'IRelayRecipient',
            abi: IRelayRecipient_json_1.default
        });
        // @ts-ignore
        this.IKnowForwarderAddress = LightTruffleContract_1.TruffleContract({
            contractName: 'IKnowForwarderAddress',
            abi: IKnowForwarderAddress_json_1.default
        });
        this.IStakeManager.setProvider(this.provider, undefined);
        this.IRelayHubContract.setProvider(this.provider, undefined);
        this.IPaymasterContract.setProvider(this.provider, undefined);
        this.IForwarderContract.setProvider(this.provider, undefined);
        this.IPenalizer.setProvider(this.provider, undefined);
        this.IRelayRecipient.setProvider(this.provider, undefined);
        this.IKnowForwarderAddress.setProvider(this.provider, undefined);
        this.relayCallMethod = this.IRelayHubContract.createContract('').methods.relayCall;
    }
    async init() {
        if (this.rawTxOptions != null) {
            throw new Error('_init was already called');
        }
        await this._resolveDeployment();
        await this._initializeContracts();
        await this._validateCompatibility();
        const chain = await this.web3.eth.net.getNetworkType();
        this.chainId = await this.web3.eth.getChainId();
        this.networkId = await this.web3.eth.net.getId();
        this.networkType = await this.web3.eth.net.getNetworkType();
        // chain === 'private' means we're on ganache, and ethereumjs-tx.Transaction doesn't support that chain type
        this.rawTxOptions = getRawTxOptions(this.chainId, this.networkId, chain);
        return this;
    }
    async _resolveDeployment() {
        if (this.deployment.paymasterAddress != null && this.deployment.relayHubAddress != null) {
            this.logger.warn('Already resolved!');
            return;
        }
        if (this.deployment.paymasterAddress != null) {
            await this._resolveDeploymentFromPaymaster(this.deployment.paymasterAddress);
        }
        else if (this.deployment.relayHubAddress != null) {
            await this._resolveDeploymentFromRelayHub(this.deployment.relayHubAddress);
        }
        else {
            this.logger.info(`Contract interactor cannot resolve a full deployment from the following input: ${JSON.stringify(this.deployment)}`);
        }
    }
    async _resolveDeploymentFromPaymaster(paymasterAddress) {
        this.paymasterInstance = await this._createPaymaster(paymasterAddress);
        const [relayHubAddress, forwarderAddress, paymasterVersion] = await Promise.all([
            this.paymasterInstance.getHubAddr().catch((e) => { throw new Error(`Not a paymaster contract: ${e.message}`); }),
            this.paymasterInstance.trustedForwarder().catch((e) => { throw new Error(`paymaster has no trustedForwarder(): ${e.message}`); }),
            this.paymasterInstance.versionPaymaster().catch((e) => { throw new Error(`Not a paymaster contract: ${e.message}`); }).then((version) => {
                this._validateVersion(version);
                return version;
            })
        ]);
        this.deployment.relayHubAddress = relayHubAddress;
        this.deployment.forwarderAddress = forwarderAddress;
        this.deployment.paymasterVersion = paymasterVersion;
        await this._resolveDeploymentFromRelayHub(relayHubAddress);
    }
    async _resolveDeploymentFromRelayHub(relayHubAddress) {
        this.relayHubInstance = await this._createRelayHub(relayHubAddress);
        const [stakeManagerAddress, penalizerAddress] = await Promise.all([
            this.relayHubInstance.stakeManager(),
            this.relayHubInstance.penalizer()
        ]);
        this.deployment.relayHubAddress = relayHubAddress;
        this.deployment.stakeManagerAddress = stakeManagerAddress;
        this.deployment.penalizerAddress = penalizerAddress;
    }
    async _validateCompatibility() {
        if (this.deployment == null || this.relayHubInstance == null) {
            return;
        }
        const hub = this.relayHubInstance;
        const version = await hub.versionHub();
        this._validateVersion(version);
    }
    _validateVersion(version) {
        const versionSatisfied = this.versionManager.isRequiredVersionSatisfied(version);
        if (!versionSatisfied) {
            throw new Error(`Provided Hub version(${version}) does not satisfy the requirement(${this.versionManager.requiredVersionRange})`);
        }
    }
    async _initializeContracts() {
        if (this.relayHubInstance == null && this.deployment.relayHubAddress != null) {
            this.relayHubInstance = await this._createRelayHub(this.deployment.relayHubAddress);
        }
        if (this.paymasterInstance == null && this.deployment.paymasterAddress != null) {
            this.paymasterInstance = await this._createPaymaster(this.deployment.paymasterAddress);
        }
        if (this.deployment.forwarderAddress != null) {
            this.forwarderInstance = await this._createForwarder(this.deployment.forwarderAddress);
        }
        if (this.deployment.stakeManagerAddress != null) {
            this.stakeManagerInstance = await this._createStakeManager(this.deployment.stakeManagerAddress);
        }
        if (this.deployment.penalizerAddress != null) {
            this.penalizerInstance = await this._createPenalizer(this.deployment.penalizerAddress);
        }
    }
    // must use these options when creating Transaction object
    getRawTxOptions() {
        if (this.rawTxOptions == null) {
            throw new Error('_init not called');
        }
        return this.rawTxOptions;
    }
    async _createKnowsForwarder(address) {
        if (this.knowForwarderAddressInstance != null && this.knowForwarderAddressInstance.address.toLowerCase() === address.toLowerCase()) {
            return this.knowForwarderAddressInstance;
        }
        this.knowForwarderAddressInstance = await this.IKnowForwarderAddress.at(address);
        return this.knowForwarderAddressInstance;
    }
    async _createRecipient(address) {
        if (this.relayRecipientInstance != null && this.relayRecipientInstance.address.toLowerCase() === address.toLowerCase()) {
            return this.relayRecipientInstance;
        }
        this.relayRecipientInstance = await this.IRelayRecipient.at(address);
        return this.relayRecipientInstance;
    }
    async _createPaymaster(address) {
        return await this.IPaymasterContract.at(address);
    }
    async _createRelayHub(address) {
        return await this.IRelayHubContract.at(address);
    }
    async _createForwarder(address) {
        return await this.IForwarderContract.at(address);
    }
    async _createStakeManager(address) {
        return await this.IStakeManager.at(address);
    }
    async _createPenalizer(address) {
        return await this.IPenalizer.at(address);
    }
    async getForwarder(recipientAddress) {
        const recipient = await this._createKnowsForwarder(recipientAddress);
        return await recipient.getTrustedForwarder();
    }
    async isTrustedForwarder(recipientAddress, forwarder) {
        const recipient = await this._createRecipient(recipientAddress);
        return await recipient.isTrustedForwarder(forwarder);
    }
    async getSenderNonce(sender, forwarderAddress) {
        const forwarder = await this._createForwarder(forwarderAddress);
        const nonce = await forwarder.getNonce(sender);
        return nonce.toString();
    }
    async _getBlockGasLimit() {
        const latestBlock = await this.web3.eth.getBlock('latest');
        return latestBlock.gasLimit;
    }
    /**
     * make a view call to relayCall(), just like the way it will be called by the relayer.
     * returns:
     * - paymasterAccepted - true if accepted
     * - reverted - true if relayCall was reverted.
     * - returnValue - if either reverted or paymaster NOT accepted, then this is the reason string.
     */
    async validateRelayCall(paymasterMaxAcceptanceBudget, relayRequest, signature, approvalData) {
        var _a;
        const relayHub = this.relayHubInstance;
        try {
            const externalGasLimit = await this.getMaxViewableGasLimit(relayRequest);
            const encodedRelayCall = relayHub.contract.methods.relayCall(paymasterMaxAcceptanceBudget, relayRequest, signature, approvalData, externalGasLimit).encodeABI();
            const res = await new Promise((resolve, reject) => {
                // @ts-ignore
                this.web3.currentProvider.send({
                    jsonrpc: '2.0',
                    id: 1,
                    method: 'eth_call',
                    params: [
                        {
                            from: relayRequest.relayData.relayWorker,
                            to: relayHub.address,
                            gasPrice: web3_utils_1.toHex(relayRequest.relayData.gasPrice),
                            gas: web3_utils_1.toHex(externalGasLimit),
                            data: encodedRelayCall
                        },
                        'latest'
                    ]
                }, (err, res) => {
                    const revertMsg = this._decodeRevertFromResponse(err, res);
                    if (revertMsg != null) {
                        reject(new Error(revertMsg));
                    }
                    if (err !== null) {
                        reject(err);
                    }
                    else {
                        resolve(res.result);
                    }
                });
            });
            this.logger.debug('relayCall res=' + res);
            // @ts-ignore
            const decoded = web3_eth_abi_1.default.decodeParameters(['bool', 'bytes'], res);
            const paymasterAccepted = decoded[0];
            let returnValue;
            if (paymasterAccepted) {
                returnValue = decoded[1];
            }
            else {
                returnValue = (_a = this._decodeRevertFromResponse({}, { result: decoded[1] })) !== null && _a !== void 0 ? _a : decoded[1];
            }
            return {
                returnValue: returnValue,
                paymasterAccepted: paymasterAccepted,
                reverted: false
            };
        }
        catch (e) {
            const message = e instanceof Error ? e.message : JSON.stringify(e, ErrorReplacerJSON_1.default);
            return {
                paymasterAccepted: false,
                reverted: true,
                returnValue: `view call to 'relayCall' reverted in client: ${message}`
            };
        }
    }
    async getMaxViewableGasLimit(relayRequest) {
        const blockGasLimit = web3_utils_1.toBN(await this._getBlockGasLimit());
        const workerBalance = web3_utils_1.toBN(await this.getBalance(relayRequest.relayData.relayWorker));
        const workerGasLimit = workerBalance.div(web3_utils_1.toBN(relayRequest.relayData.gasPrice === '0' ? 1 : relayRequest.relayData.gasPrice));
        return bn_js_1.default.min(blockGasLimit, workerGasLimit);
    }
    /**
     * decode revert from rpc response.
     * called from the callback of the provider "eth_call" call.
     * check if response is revert, and extract revert reason from it.
     * support kovan, geth, ganache error formats..
     * @param err - provider err value
     * @param res - provider res value
     */
    // decode revert from rpc response.
    //
    _decodeRevertFromResponse(err, res) {
        var _a, _b, _c, _d;
        const matchGanache = (_b = (_a = res === null || res === void 0 ? void 0 : res.error) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.match(/: revert (.*)/);
        if (matchGanache != null) {
            return matchGanache[1];
        }
        const m = (_c = err === null || err === void 0 ? void 0 : err.data) === null || _c === void 0 ? void 0 : _c.match(/(0x08c379a0\S*)/);
        if (m != null) {
            return Utils_1.decodeRevertReason(m[1]);
        }
        const result = (_d = res === null || res === void 0 ? void 0 : res.result) !== null && _d !== void 0 ? _d : '';
        if (result.startsWith('0x08c379a0')) {
            return Utils_1.decodeRevertReason(result);
        }
        return null;
    }
    encodeABI(paymasterMaxAcceptanceBudget, relayRequest, sig, approvalData, externalGasLimit) {
        return this.relayCallMethod(paymasterMaxAcceptanceBudget, relayRequest, sig, approvalData, externalGasLimit).encodeABI();
    }
    async getPastEventsForHub(extraTopics, options, names = ActiveManagerEvents) {
        return await this._getPastEvents(this.relayHubInstance.contract, names, extraTopics, options);
    }
    async getPastEventsForStakeManager(names, extraTopics, options) {
        const stakeManager = await this.stakeManagerInstance;
        return await this._getPastEvents(stakeManager.contract, names, extraTopics, options);
    }
    // eslint-disable-next-line @typescript-eslint/require-await
    async _getPastEvents(contract, names, extraTopics, options) {
        const topics = [];
        const eventTopic = Utils_1.event2topic(contract, names);
        topics.push(eventTopic);
        if (extraTopics.length > 0) {
            topics.push(extraTopics);
        }
        return contract.getPastEvents('allEvents', Object.assign({}, options, { topics }));
    }
    async getBalance(address, defaultBlock = 'latest') {
        return await this.web3.eth.getBalance(address, defaultBlock);
    }
    async getBlockNumber() {
        return await this.web3.eth.getBlockNumber();
    }
    async sendSignedTransaction(rawTx) {
        // noinspection ES6RedundantAwait - PromiEvent makes lint less happy about this line
        return await this.web3.eth.sendSignedTransaction(rawTx);
    }
    async estimateGas(gsnTransactionDetails) {
        return await this.web3.eth.estimateGas(gsnTransactionDetails);
    }
    // TODO: cache response for some time to optimize. It doesn't make sense to optimize these requests in calling code.
    async getGasPrice() {
        return await this.web3.eth.getGasPrice();
    }
    async getTransactionCount(address, defaultBlock) {
        // @ts-ignore (web3 does not define 'defaultBlock' as optional)
        return await this.web3.eth.getTransactionCount(address, defaultBlock);
    }
    async getTransaction(transactionHash) {
        return await this.web3.eth.getTransaction(transactionHash);
    }
    async getBlock(blockHashOrBlockNumber) {
        return await this.web3.eth.getBlock(blockHashOrBlockNumber);
    }
    validateAddress(address, exceptionTitle = 'invalid address:') {
        if (!this.web3.utils.isAddress(address)) {
            throw new Error(exceptionTitle + ' ' + address);
        }
    }
    async getCode(address) {
        return await this.web3.eth.getCode(address);
    }
    getNetworkId() {
        if (this.networkId == null) {
            throw new Error('_init not called');
        }
        return this.networkId;
    }
    getNetworkType() {
        if (this.networkType == null) {
            throw new Error('_init not called');
        }
        return this.networkType;
    }
    async isContractDeployed(address) {
        const code = await this.web3.eth.getCode(address);
        return code !== '0x';
    }
    async getStakeInfo(managerAddress) {
        const stakeManager = await this.stakeManagerInstance;
        return await stakeManager.getStakeInfo(managerAddress);
    }
    /**
     * Gets balance of an address on the current RelayHub.
     * @param address - can be a Paymaster or a Relay Manger
     */
    async hubBalanceOf(address) {
        return await this.relayHubInstance.balanceOf(address);
    }
    async initDeployment(deployment) {
        this.deployment = deployment;
        await this._initializeContracts();
    }
    getDeployment() {
        if (this.deployment == null) {
            throw new Error('Contracts deployment is not initialized for Contract Interactor!');
        }
        return this.deployment;
    }
    async withdrawHubBalanceEstimateGas(amount, destination, managerAddress, gasPrice) {
        const hub = this.relayHubInstance;
        const method = hub.contract.methods.withdraw(amount.toString(), destination);
        const withdrawTxGasLimit = await method.estimateGas({
            from: managerAddress
        });
        const gasCost = web3_utils_1.toBN(withdrawTxGasLimit).mul(web3_utils_1.toBN(gasPrice));
        return {
            gasLimit: parseInt(withdrawTxGasLimit),
            gasCost,
            method
        };
    }
    // TODO: a way to make a relay hub transaction with a specified nonce without exposing the 'method' abstraction
    async getRegisterRelayMethod(baseRelayFee, pctRelayFee, url) {
        const hub = this.relayHubInstance;
        return hub.contract.methods.registerRelayServer(baseRelayFee, pctRelayFee, url);
    }
    async getAddRelayWorkersMethod(workers) {
        const hub = this.relayHubInstance;
        return hub.contract.methods.addRelayWorkers(workers);
    }
    /**
     * Web3.js as of 1.2.6 (see web3-core-method::_confirmTransaction) does not allow
     * broadcasting of a transaction without waiting for it to be mined.
     * This method sends the RPC call directly
     * @param signedTransaction - the raw signed transaction to broadcast
     */
    async broadcastTransaction(signedTransaction) {
        return await new Promise((resolve, reject) => {
            if (this.provider == null) {
                throw new Error('provider is not set');
            }
            this.provider.send({
                jsonrpc: '2.0',
                method: 'eth_sendRawTransaction',
                params: [
                    signedTransaction
                ],
                id: Date.now()
            }, (e, r) => {
                if (e != null) {
                    reject(e);
                }
                else if (r.error != null) {
                    reject(r.error);
                }
                else {
                    resolve(r.result);
                }
            });
        });
    }
    async hubDepositFor(paymaster, transactionDetails) {
        return await this.relayHubInstance.depositFor(paymaster, transactionDetails);
    }
}
exports.default = ContractInteractor;
/**
 * Ganache does not seem to enforce EIP-155 signature. Buidler does, though.
 * This is how {@link Transaction} constructor allows support for custom and private network.
 * @param chainId
 * @param networkId
 * @param chain
 * @return {{common: Common}}
 */
function getRawTxOptions(chainId, networkId, chain) {
    if (chain == null || chain === 'main' || chain === 'private') {
        chain = 'mainnet';
    }
    return {
        common: ethereumjs_common_1.default.forCustomChain(chain, {
            chainId,
            networkId
        }, 'istanbul')
    };
}
exports.getRawTxOptions = getRawTxOptions;
//# sourceMappingURL=ContractInteractor.js.map