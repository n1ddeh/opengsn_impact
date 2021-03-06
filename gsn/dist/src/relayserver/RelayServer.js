"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = __importDefault(require("chalk"));
const events_1 = require("events");
const web3_utils_1 = require("web3-utils");
const ContractInteractor_1 = require("../common/ContractInteractor");
const VersionsManager_1 = __importDefault(require("../common/VersionsManager"));
const AmountRequired_1 = require("../common/AmountRequired");
const Environments_1 = require("../common/Environments");
const Version_1 = require("../common/Version");
const Utils_1 = require("../common/Utils");
const RegistrationManager_1 = require("./RegistrationManager");
const ReputationManager_1 = require("./ReputationManager");
const StoredTransaction_1 = require("./StoredTransaction");
const ServerConfigParams_1 = require("./ServerConfigParams");
const GAS_RESERVE = 100000;
class RelayServer extends events_1.EventEmitter {
    constructor(config, transactionManager, dependencies) {
        super();
        this.lastScannedBlock = 0;
        this.lastRefreshBlock = 0;
        this.ready = false;
        this.lastSuccessfulRounds = Number.MAX_SAFE_INTEGER;
        this.gasPrice = 0;
        this._workerSemaphoreOn = false;
        this.alerted = false;
        this.alertedBlock = 0;
        this.initialized = false;
        this.trustedPaymastersGasLimits = new Map();
        this.logger = dependencies.logger;
        this.versionManager = new VersionsManager_1.default(Version_1.gsnRuntimeVersion, Version_1.gsnRequiredVersion);
        this.config = ServerConfigParams_1.configureServer(config);
        this.contractInteractor = dependencies.contractInteractor;
        this.gasPriceFetcher = dependencies.gasPriceFetcher;
        this.txStoreManager = dependencies.txStoreManager;
        this.transactionManager = transactionManager;
        this.managerAddress = this.transactionManager.managerKeyManager.getAddress(0);
        this.workerAddress = this.transactionManager.workersKeyManager.getAddress(0);
        this.workerBalanceRequired = new AmountRequired_1.AmountRequired('Worker Balance', web3_utils_1.toBN(this.config.workerMinBalance), this.logger);
        if (this.config.runPaymasterReputations) {
            if (dependencies.reputationManager == null) {
                throw new Error('ReputationManager is not initialized');
            }
            this.reputationManager = dependencies.reputationManager;
        }
        this.printServerAddresses();
        this.logger.warn(`RelayServer version', ${Version_1.gsnRuntimeVersion}`);
        this.logger.info(`Using server configuration:\n ${JSON.stringify(this.config)}`);
    }
    printServerAddresses() {
        this.logger.info(`Server manager address  | ${this.managerAddress}`);
        this.logger.info(`Server worker  address  | ${this.workerAddress}`);
    }
    getMinGasPrice() {
        return this.gasPrice;
    }
    async pingHandler(paymaster) {
        var _a, _b, _c;
        if (this.config.runPaymasterReputations && paymaster != null) {
            const status = await this.reputationManager.getPaymasterStatus(paymaster, this.lastScannedBlock);
            if (status === ReputationManager_1.PaymasterStatus.BLOCKED || status === ReputationManager_1.PaymasterStatus.ABUSED) {
                throw new Error(`This paymaster will not be served, status: ${status}`);
            }
        }
        return {
            relayWorkerAddress: this.workerAddress,
            relayManagerAddress: this.managerAddress,
            relayHubAddress: (_b = (_a = this.relayHubContract) === null || _a === void 0 ? void 0 : _a.address) !== null && _b !== void 0 ? _b : '',
            minGasPrice: this.getMinGasPrice().toString(),
            maxAcceptanceBudget: this._getPaymasterMaxAcceptanceBudget(paymaster),
            chainId: this.chainId.toString(),
            networkId: this.networkId.toString(),
            ready: (_c = this.isReady()) !== null && _c !== void 0 ? _c : false,
            version: Version_1.gsnRuntimeVersion
        };
    }
    validateInput(req) {
        // Check that the relayHub is the correct one
        if (req.metadata.relayHubAddress !== this.relayHubContract.address) {
            throw new Error(`Wrong hub address.\nRelay server's hub address: ${this.relayHubContract.address}, request's hub address: ${req.metadata.relayHubAddress}\n`);
        }
        // Check the relayWorker (todo: once migrated to multiple relays, check if exists)
        if (req.relayRequest.relayData.relayWorker.toLowerCase() !== this.workerAddress.toLowerCase()) {
            throw new Error(`Wrong worker address: ${req.relayRequest.relayData.relayWorker}\n`);
        }
        // Check that the gasPrice is initialized & acceptable
        if (this.gasPrice > parseInt(req.relayRequest.relayData.gasPrice)) {
            throw new Error(`Unacceptable gasPrice: relayServer's gasPrice:${this.gasPrice} request's gasPrice: ${req.relayRequest.relayData.gasPrice}`);
        }
    }
    validateFees(req) {
        // if trusted paymaster, we trust it to handle fees
        if (this._isTrustedPaymaster(req.relayRequest.relayData.paymaster)) {
            return;
        }
        // Check that the fee is acceptable
        if (parseInt(req.relayRequest.relayData.pctRelayFee) < this.config.pctRelayFee) {
            throw new Error(`Unacceptable pctRelayFee: ${req.relayRequest.relayData.pctRelayFee} relayServer's pctRelayFee: ${this.config.pctRelayFee}`);
        }
        if (web3_utils_1.toBN(req.relayRequest.relayData.baseRelayFee).lt(web3_utils_1.toBN(this.config.baseRelayFee))) {
            throw new Error(`Unacceptable baseRelayFee: ${req.relayRequest.relayData.baseRelayFee} relayServer's baseRelayFee: ${this.config.baseRelayFee}`);
        }
    }
    async validateMaxNonce(relayMaxNonce) {
        // Check that max nonce is valid
        const nonce = await this.transactionManager.pollNonce(this.workerAddress);
        if (nonce > relayMaxNonce) {
            throw new Error(`Unacceptable relayMaxNonce: ${relayMaxNonce}. current nonce: ${nonce}`);
        }
    }
    async validatePaymasterReputation(paymaster, currentBlockNumber) {
        const status = await this.reputationManager.getPaymasterStatus(paymaster, currentBlockNumber);
        if (status === ReputationManager_1.PaymasterStatus.GOOD) {
            return;
        }
        let message;
        switch (status) {
            case ReputationManager_1.PaymasterStatus.ABUSED:
                message = 'This paymaster has failed a lot of transactions recently is temporarily blocked by this relay';
                break;
            case ReputationManager_1.PaymasterStatus.THROTTLED:
                message = 'This paymaster only had a small number of successful transactions and is therefore throttled by this relay';
                break;
            case ReputationManager_1.PaymasterStatus.BLOCKED:
                message = 'This paymaster had too many unsuccessful transactions and is now permanently blocked by this relay';
                break;
        }
        throw new Error(`Refusing to serve transactions for paymaster at ${paymaster}: ${message}`);
    }
    async validatePaymasterGasLimits(req) {
        const paymaster = req.relayRequest.relayData.paymaster;
        let gasLimits = this.trustedPaymastersGasLimits.get(paymaster);
        let acceptanceBudget;
        if (gasLimits == null) {
            try {
                const paymasterContract = await this.contractInteractor._createPaymaster(paymaster);
                gasLimits = await paymasterContract.getGasLimits();
            }
            catch (e) {
                const error = e;
                let message = `unknown paymaster error: ${error.message}`;
                if (error.message.includes('Returned values aren\'t valid, did it run Out of Gas?')) {
                    message = `not a valid paymaster contract: ${paymaster}`;
                }
                else if (error.message.includes('no code at address')) {
                    message = `'non-existent paymaster contract: ${paymaster}`;
                }
                throw new Error(message);
            }
            acceptanceBudget = this.config.maxAcceptanceBudget;
            const paymasterAcceptanceBudget = parseInt(gasLimits.acceptanceBudget);
            if (paymasterAcceptanceBudget > acceptanceBudget) {
                if (!this._isTrustedPaymaster(paymaster)) {
                    throw new Error(`paymaster acceptance budget too high. given: ${paymasterAcceptanceBudget} max allowed: ${this.config.maxAcceptanceBudget}`);
                }
                this.logger.debug(`Using trusted paymaster's higher than max acceptance budget: ${paymasterAcceptanceBudget}`);
                acceptanceBudget = paymasterAcceptanceBudget;
            }
        }
        else {
            // its a trusted paymaster. just use its acceptance budget as-is
            acceptanceBudget = parseInt(gasLimits.acceptanceBudget);
        }
        const hubOverhead = (await this.relayHubContract.gasOverhead()).toNumber();
        const maxPossibleGas = GAS_RESERVE + Utils_1.calculateTransactionMaxPossibleGas({
            gasLimits,
            hubOverhead,
            relayCallGasLimit: req.relayRequest.request.gas
        });
        const maxCharge = await this.relayHubContract.calculateCharge(maxPossibleGas, req.relayRequest.relayData);
        const paymasterBalance = await this.relayHubContract.balanceOf(paymaster);
        if (paymasterBalance.lt(maxCharge)) {
            throw new Error(`paymaster balance too low: ${paymasterBalance.toString()}, maxCharge: ${maxCharge.toString()}`);
        }
        this.logger.debug(`paymaster balance: ${paymasterBalance.toString()}, maxCharge: ${maxCharge.toString()}`);
        this.logger.debug(`Estimated max charge of relayed tx: ${maxCharge.toString()}, GasLimit of relayed tx: ${maxPossibleGas}`);
        return {
            acceptanceBudget,
            maxPossibleGas
        };
    }
    async validateViewCallSucceeds(req, acceptanceBudget, maxPossibleGas) {
        const method = this.relayHubContract.contract.methods.relayCall(acceptanceBudget, req.relayRequest, req.metadata.signature, req.metadata.approvalData, maxPossibleGas);
        let viewRelayCallRet;
        try {
            viewRelayCallRet =
                await method.call({
                    from: this.workerAddress,
                    gasPrice: req.relayRequest.relayData.gasPrice,
                    gasLimit: maxPossibleGas
                }, 'pending');
        }
        catch (e) {
            throw new Error(`relayCall reverted in server: ${e.message}`);
        }
        this.logger.debug(`Result for view-only relay call (on pending blck):
paymasterAccepted  | ${viewRelayCallRet.paymasterAccepted ? chalk_1.default.green('true') : chalk_1.default.red('false')}
returnValue        | ${viewRelayCallRet.returnValue}
`);
        if (!viewRelayCallRet.paymasterAccepted) {
            throw new Error(`Paymaster rejected in server: ${Utils_1.decodeRevertReason(viewRelayCallRet.returnValue)} req=${JSON.stringify(req, null, 2)}`);
        }
    }
    async createRelayTransaction(req) {
        this.logger.debug(`dump request params: ${JSON.stringify(req)}`);
        if (!this.isReady()) {
            throw new Error('relay not ready');
        }
        if (this.alerted) {
            this.logger.error('Alerted state: slowing down traffic');
            await Utils_1.sleep(Utils_1.randomInRange(this.config.minAlertedDelayMS, this.config.maxAlertedDelayMS));
        }
        this.validateInput(req);
        this.validateFees(req);
        await this.validateMaxNonce(req.metadata.relayMaxNonce);
        if (this.config.runPaymasterReputations) {
            await this.validatePaymasterReputation(req.relayRequest.relayData.paymaster, this.lastScannedBlock);
        }
        // Call relayCall as a view function to see if we'll get paid for relaying this tx
        const { acceptanceBudget, maxPossibleGas } = await this.validatePaymasterGasLimits(req);
        await this.validateViewCallSucceeds(req, acceptanceBudget, maxPossibleGas);
        if (this.config.runPaymasterReputations) {
            await this.reputationManager.onRelayRequestAccepted(req.relayRequest.relayData.paymaster);
        }
        // Send relayed transaction
        this.logger.debug(`maxPossibleGas is: ${maxPossibleGas}`);
        const method = this.relayHubContract.contract.methods.relayCall(acceptanceBudget, req.relayRequest, req.metadata.signature, req.metadata.approvalData, maxPossibleGas);
        const currentBlock = await this.contractInteractor.getBlockNumber();
        const details = {
            signer: this.workerAddress,
            serverAction: StoredTransaction_1.ServerAction.RELAY_CALL,
            method,
            destination: req.metadata.relayHubAddress,
            gasLimit: maxPossibleGas,
            creationBlockNumber: currentBlock,
            gasPrice: req.relayRequest.relayData.gasPrice
        };
        const { signedTx } = await this.transactionManager.sendTransaction(details);
        // after sending a transaction is a good time to check the worker's balance, and replenish it.
        await this.replenishServer(0, currentBlock);
        return signedTx;
    }
    async intervalHandler() {
        const now = Date.now();
        let workerTimeout;
        if (!this.config.devMode) {
            workerTimeout = setTimeout(() => {
                const timedOut = Date.now() - now;
                this.logger.warn(chalk_1.default.bgRedBright(`Relay state: Timed-out after ${timedOut}`));
                this.lastSuccessfulRounds = 0;
            }, this.config.readyTimeout);
        }
        return this.contractInteractor.getBlock('latest')
            .then(block => {
            if (block.number > this.lastScannedBlock) {
                return this._workerSemaphore.bind(this)(block.number);
            }
        })
            .catch((e) => {
            this.emit('error', e);
            const error = e;
            this.logger.error(`error in worker: ${error.message} ${error.stack}`);
            this.lastSuccessfulRounds = 0;
        })
            .finally(() => {
            clearTimeout(workerTimeout);
        });
    }
    start() {
        this.logger.debug(`Started polling for new blocks every ${this.config.checkInterval}ms`);
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        this.workerTask = setInterval(this.intervalHandler.bind(this), this.config.checkInterval);
    }
    stop() {
        if (this.workerTask == null) {
            throw new Error('Server not started');
        }
        clearInterval(this.workerTask);
        this.logger.info('Successfully stopped polling!!');
    }
    async _workerSemaphore(blockNumber) {
        if (this._workerSemaphoreOn) {
            this.logger.warn('Different worker is not finished yet, skipping this block');
            return;
        }
        this._workerSemaphoreOn = true;
        await this._worker(blockNumber)
            .then((transactions) => {
            this.lastSuccessfulRounds++;
            if (transactions.length !== 0) {
                this.logger.debug(`Done handling block #${blockNumber}. Created ${transactions.length} transactions.`);
            }
        })
            .finally(() => {
            this._workerSemaphoreOn = false;
        });
    }
    fatal(message) {
        this.logger.error('FATAL: ' + message);
        process.exit(1);
    }
    /***
     * initialize data from trusted paymasters.
     * "Trusted" paymasters means that:
     * - we trust their code not to alter the gas limits (getGasLimits returns constants)
     * - we trust preRelayedCall to be consistent: off-chain call and on-chain calls should either both succeed
     *    or both revert.
     * - given that, we agree to give the requested acceptanceBudget (since breaking one of the above two "invariants"
     *    is the only cases where the relayer will have to pay for this budget)
     *
     * @param paymasters list of trusted paymaster addresses
     */
    async _initTrustedPaymasters(paymasters = []) {
        this.trustedPaymastersGasLimits.clear();
        for (const paymasterAddress of paymasters) {
            const paymaster = await this.contractInteractor._createPaymaster(paymasterAddress);
            const gasLimits = await paymaster.getGasLimits().catch((e) => {
                throw new Error(`not a valid paymaster address in trustedPaymasters list: ${paymasterAddress}: ${e.message}`);
            });
            this.trustedPaymastersGasLimits.set(paymasterAddress.toLowerCase(), gasLimits);
        }
    }
    _getPaymasterMaxAcceptanceBudget(paymaster) {
        const limits = this.trustedPaymastersGasLimits.get(paymaster === null || paymaster === void 0 ? void 0 : paymaster.toLocaleLowerCase());
        if (limits != null) {
            return limits.acceptanceBudget;
        }
        else {
            return this.config.maxAcceptanceBudget.toString();
        }
    }
    async init() {
        if (this.initialized) {
            throw new Error('_init was already called');
        }
        await this.transactionManager._init();
        await this._initTrustedPaymasters(this.config.trustedPaymasters);
        this.relayHubContract = await this.contractInteractor.relayHubInstance;
        const relayHubAddress = this.relayHubContract.address;
        const code = await this.contractInteractor.getCode(relayHubAddress);
        if (code.length < 10) {
            this.fatal(`No RelayHub deployed at address ${relayHubAddress}.`);
        }
        this.registrationManager = new RegistrationManager_1.RegistrationManager(this.contractInteractor, this.transactionManager, this.txStoreManager, this, this.logger, this.config, this.managerAddress, this.workerAddress);
        await this.registrationManager.init();
        this.chainId = await this.contractInteractor.chainId;
        this.networkId = await this.contractInteractor.getNetworkId();
        if (this.config.devMode && (this.chainId < 1000 || this.networkId < 1000)) {
            this.logger.error('Don\'t use real network\'s chainId & networkId while in devMode.');
            process.exit(-1);
        }
        const latestBlock = await this.contractInteractor.getBlock('latest');
        this.logger.info(`Current network info:
chainId                 | ${this.chainId}
networkId               | ${this.networkId}
latestBlock             | ${latestBlock.number}
latestBlock timestamp   | ${latestBlock.timestamp}
`);
        this.initialized = true;
        // Assume started server is not registered until _worker figures stuff out
        this.registrationManager.printNotRegisteredMessage();
    }
    async replenishServer(workerIndex, currentBlock) {
        var _a;
        const transactionHashes = [];
        let managerEthBalance = await this.getManagerBalance();
        const managerHubBalance = await this.relayHubContract.balanceOf(this.managerAddress);
        this.workerBalanceRequired.currentValue = await this.getWorkerBalance(workerIndex);
        if (managerEthBalance.gte(web3_utils_1.toBN(this.config.managerTargetBalance.toString())) && this.workerBalanceRequired.isSatisfied) {
            // all filled, nothing to do
            return transactionHashes;
        }
        const mustWithdrawHubDeposit = managerEthBalance.lt(web3_utils_1.toBN(this.config.managerTargetBalance.toString())) && managerHubBalance.gte(web3_utils_1.toBN(this.config.minHubWithdrawalBalance));
        const isWithdrawalPending = await this.txStoreManager.isActionPending(StoredTransaction_1.ServerAction.DEPOSIT_WITHDRAWAL);
        if (mustWithdrawHubDeposit && !isWithdrawalPending) {
            this.logger.info(`withdrawing manager hub balance (${managerHubBalance.toString()}) to manager`);
            // Refill manager eth balance from hub balance
            const method = (_a = this.relayHubContract) === null || _a === void 0 ? void 0 : _a.contract.methods.withdraw(web3_utils_1.toHex(managerHubBalance), this.managerAddress);
            const gasLimit = await this.transactionManager.attemptEstimateGas('Withdraw', method, this.managerAddress);
            const details = {
                signer: this.managerAddress,
                serverAction: StoredTransaction_1.ServerAction.DEPOSIT_WITHDRAWAL,
                destination: this.relayHubContract.address,
                creationBlockNumber: currentBlock,
                gasLimit,
                method
            };
            const { transactionHash } = await this.transactionManager.sendTransaction(details);
            transactionHashes.push(transactionHash);
        }
        managerEthBalance = await this.getManagerBalance();
        const mustReplenishWorker = !this.workerBalanceRequired.isSatisfied;
        const isReplenishPendingForWorker = await this.txStoreManager.isActionPending(StoredTransaction_1.ServerAction.VALUE_TRANSFER, this.workerAddress);
        if (mustReplenishWorker && !isReplenishPendingForWorker) {
            const refill = web3_utils_1.toBN(this.config.workerTargetBalance.toString()).sub(this.workerBalanceRequired.currentValue);
            this.logger.debug(`== replenishServer: mgr balance=${managerEthBalance.toString()}  manager hub balance=${managerHubBalance.toString()}
          \n${this.workerBalanceRequired.description}\n refill=${refill.toString()}`);
            if (refill.lt(managerEthBalance.sub(web3_utils_1.toBN(this.config.managerMinBalance)))) {
                this.logger.debug('Replenishing worker balance by manager eth balance');
                const details = {
                    signer: this.managerAddress,
                    serverAction: StoredTransaction_1.ServerAction.VALUE_TRANSFER,
                    destination: this.workerAddress,
                    value: web3_utils_1.toHex(refill),
                    creationBlockNumber: currentBlock,
                    gasLimit: Environments_1.defaultEnvironment.mintxgascost
                };
                const { transactionHash } = await this.transactionManager.sendTransaction(details);
                transactionHashes.push(transactionHash);
            }
            else {
                const message = `== replenishServer: can't replenish: mgr balance too low ${managerEthBalance.toString()} refill=${refill.toString()}`;
                this.emit('fundingNeeded', message);
                this.logger.error(message);
            }
        }
        return transactionHashes;
    }
    async _worker(blockNumber) {
        if (!this.initialized) {
            await this.init();
        }
        if (blockNumber <= this.lastScannedBlock) {
            throw new Error('Attempt to scan older block, aborting');
        }
        if (!this._shouldRefreshState(blockNumber)) {
            return [];
        }
        this.lastRefreshBlock = blockNumber;
        await this._refreshGasPrice();
        await this.registrationManager.refreshBalance();
        if (!this.registrationManager.balanceRequired.isSatisfied) {
            this.setReadyState(false);
            return [];
        }
        return await this._handleChanges(blockNumber);
    }
    async _refreshGasPrice() {
        const gasPriceString = await this.gasPriceFetcher.getGasPrice();
        this.gasPrice = Math.floor(parseInt(gasPriceString) * this.config.gasPriceFactor);
        if (this.gasPrice === 0) {
            throw new Error('Could not get gasPrice from node');
        }
    }
    async _handleChanges(currentBlockNumber) {
        let transactionHashes = [];
        const hubEventsSinceLastScan = await this.getAllHubEventsSinceLastScan();
        await this._updateLatestTxBlockNumber(hubEventsSinceLastScan);
        const shouldRegisterAgain = await this._shouldRegisterAgain(currentBlockNumber, hubEventsSinceLastScan);
        transactionHashes = transactionHashes.concat(await this.registrationManager.handlePastEvents(hubEventsSinceLastScan, this.lastScannedBlock, currentBlockNumber, shouldRegisterAgain));
        await this.transactionManager.removeConfirmedTransactions(currentBlockNumber);
        await this._boostStuckPendingTransactions(currentBlockNumber);
        this.lastScannedBlock = currentBlockNumber;
        const isRegistered = await this.registrationManager.isRegistered();
        if (!isRegistered) {
            this.setReadyState(false);
            return transactionHashes;
        }
        await this.handlePastHubEvents(currentBlockNumber, hubEventsSinceLastScan);
        const workerIndex = 0;
        transactionHashes = transactionHashes.concat(await this.replenishServer(workerIndex, currentBlockNumber));
        const workerBalance = await this.getWorkerBalance(workerIndex);
        if (workerBalance.lt(web3_utils_1.toBN(this.config.workerMinBalance))) {
            this.setReadyState(false);
            return transactionHashes;
        }
        this.setReadyState(true);
        if (this.alerted && this.alertedBlock + this.config.alertedBlockDelay < currentBlockNumber) {
            this.logger.warn(`Relay exited alerted state. Alerted block: ${this.alertedBlock}. Current block number: ${currentBlockNumber}`);
            this.alerted = false;
        }
        return transactionHashes;
    }
    async getManagerBalance() {
        return web3_utils_1.toBN(await this.contractInteractor.getBalance(this.managerAddress, 'pending'));
    }
    async getWorkerBalance(workerIndex) {
        return web3_utils_1.toBN(await this.contractInteractor.getBalance(this.workerAddress, 'pending'));
    }
    async _shouldRegisterAgain(currentBlock, hubEventsSinceLastScan) {
        const isPendingActivityTransaction = (await this.txStoreManager.isActionPending(StoredTransaction_1.ServerAction.RELAY_CALL)) ||
            (await this.txStoreManager.isActionPending(StoredTransaction_1.ServerAction.REGISTER_SERVER));
        if (this.config.registrationBlockRate === 0 || isPendingActivityTransaction) {
            this.logger.debug(`_shouldRegisterAgain returns false isPendingActivityTransaction=${isPendingActivityTransaction} registrationBlockRate=${this.config.registrationBlockRate}`);
            return false;
        }
        const latestTxBlockNumber = this._getLatestTxBlockNumber();
        const registrationExpired = currentBlock - latestTxBlockNumber >= this.config.registrationBlockRate;
        if (!registrationExpired) {
            this.logger.debug(`_shouldRegisterAgain registrationExpired=${registrationExpired} currentBlock=${currentBlock} latestTxBlockNumber=${latestTxBlockNumber} registrationBlockRate=${this.config.registrationBlockRate}`);
        }
        return registrationExpired;
    }
    _shouldRefreshState(currentBlock) {
        return currentBlock - this.lastRefreshBlock >= this.config.refreshStateTimeoutBlocks || !this.isReady();
    }
    async handlePastHubEvents(currentBlockNumber, hubEventsSinceLastScan) {
        for (const event of hubEventsSinceLastScan) {
            switch (event.event) {
                case ContractInteractor_1.TransactionRejectedByPaymaster:
                    this.logger.debug(`handle TransactionRejectedByPaymaster event: ${JSON.stringify(event)}`);
                    await this._handleTransactionRejectedByPaymasterEvent(event.returnValues.paymaster, currentBlockNumber, event.blockNumber);
                    break;
                case ContractInteractor_1.TransactionRelayed:
                    this.logger.debug(`handle TransactionRelayed event: ${JSON.stringify(event)}`);
                    await this._handleTransactionRelayedEvent(event.returnValues.paymaster, event.blockNumber);
                    break;
            }
        }
    }
    async getAllHubEventsSinceLastScan() {
        const topics = [Utils_1.address2topic(this.managerAddress)];
        const options = {
            fromBlock: this.lastScannedBlock + 1,
            toBlock: 'latest'
        };
        const events = await this.contractInteractor.getPastEventsForHub(topics, options);
        if (events.length !== 0) {
            this.logger.debug(`Found ${events.length} events since last scan`);
        }
        return events;
    }
    async _handleTransactionRelayedEvent(paymaster, eventBlockNumber) {
        if (this.config.runPaymasterReputations) {
            await this.reputationManager.updatePaymasterStatus(paymaster, true, eventBlockNumber);
        }
    }
    // TODO: do not call this method when events are processed already (stateful server thing)
    async _handleTransactionRejectedByPaymasterEvent(paymaster, currentBlockNumber, eventBlockNumber) {
        this.alerted = true;
        this.alertedBlock = eventBlockNumber;
        this.logger.error(`Relay entered alerted state. Block number: ${currentBlockNumber}`);
        if (this.config.runPaymasterReputations) {
            await this.reputationManager.updatePaymasterStatus(paymaster, false, eventBlockNumber);
        }
    }
    _getLatestTxBlockNumber() {
        var _a, _b;
        return (_b = (_a = this.lastMinedActiveTransaction) === null || _a === void 0 ? void 0 : _a.blockNumber) !== null && _b !== void 0 ? _b : -1;
    }
    async _updateLatestTxBlockNumber(eventsSinceLastScan) {
        var _a, _b;
        const latestTransactionSinceLastScan = Utils_1.getLatestEventData(eventsSinceLastScan);
        if (latestTransactionSinceLastScan != null) {
            this.lastMinedActiveTransaction = latestTransactionSinceLastScan;
            this.logger.debug(`found newer block ${(_a = this.lastMinedActiveTransaction) === null || _a === void 0 ? void 0 : _a.blockNumber}`);
        }
        if (this.lastMinedActiveTransaction == null) {
            this.lastMinedActiveTransaction = await this._queryLatestActiveEvent();
            this.logger.debug(`queried node for last active server event, found in block ${(_b = this.lastMinedActiveTransaction) === null || _b === void 0 ? void 0 : _b.blockNumber}`);
        }
    }
    async _queryLatestActiveEvent() {
        const events = await this.contractInteractor.getPastEventsForHub([Utils_1.address2topic(this.managerAddress)], {
            fromBlock: 1
        });
        return Utils_1.getLatestEventData(events);
    }
    /**
     * Resend all outgoing pending transactions with insufficient gas price by all signers (manager, workers)
     * @return the mapping of the previous transaction hash to details of a new boosted transaction
     */
    async _boostStuckPendingTransactions(blockNumber) {
        const transactionDetails = new Map();
        // repeat separately for each signer (manager, all workers)
        const managerBoostedTransactions = await this._boostStuckTransactionsForManager(blockNumber);
        for (const [txHash, boostedTxDetails] of managerBoostedTransactions) {
            transactionDetails.set(txHash, boostedTxDetails);
        }
        for (const workerIndex of [0]) {
            const workerBoostedTransactions = await this._boostStuckTransactionsForWorker(blockNumber, workerIndex);
            for (const [txHash, boostedTxDetails] of workerBoostedTransactions) {
                transactionDetails.set(txHash, boostedTxDetails);
            }
        }
        return transactionDetails;
    }
    async _boostStuckTransactionsForManager(blockNumber) {
        return await this.transactionManager.boostUnderpricedPendingTransactionsForSigner(this.managerAddress, blockNumber);
    }
    async _boostStuckTransactionsForWorker(blockNumber, workerIndex) {
        const signer = this.workerAddress;
        return await this.transactionManager.boostUnderpricedPendingTransactionsForSigner(signer, blockNumber);
    }
    _isTrustedPaymaster(paymaster) {
        return this.trustedPaymastersGasLimits.get(paymaster.toLocaleLowerCase()) != null;
    }
    isReady() {
        if (this.lastSuccessfulRounds < this.config.successfulRoundsForReady) {
            return false;
        }
        return this.ready;
    }
    setReadyState(isReady) {
        if (this.isReady() !== isReady) {
            if (isReady) {
                if (this.lastSuccessfulRounds < this.config.successfulRoundsForReady) {
                    const roundsUntilReady = this.config.successfulRoundsForReady - this.lastSuccessfulRounds;
                    this.logger.warn(chalk_1.default.yellow(`Relayer state: almost READY (in ${roundsUntilReady} rounds)`));
                }
                else {
                    this.logger.warn(chalk_1.default.greenBright('Relayer state: READY'));
                }
            }
            else {
                this.logger.warn(chalk_1.default.redBright('Relayer state: NOT-READY'));
            }
        }
        this.ready = isReady;
    }
}
exports.RelayServer = RelayServer;
//# sourceMappingURL=RelayServer.js.map