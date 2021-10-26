"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = __importDefault(require("chalk"));
const web3_utils_1 = require("web3-utils");
const AmountRequired_1 = require("../common/AmountRequired");
const Utils_1 = require("../common/Utils");
const Environments_1 = require("../common/Environments");
const ContractInteractor_1 = require("../common/ContractInteractor");
const StoredTransaction_1 = require("./StoredTransaction");
const mintxgascost = Environments_1.defaultEnvironment.mintxgascost;
class RegistrationManager {
    constructor(contractInteractor, transactionManager, txStoreManager, eventEmitter, logger, config, 
    // exposed from key manager?
    managerAddress, workerAddress) {
        this._isHubAuthorized = false;
        this._isStakeLocked = false;
        this.isInitialized = false;
        this.delayedEvents = [];
        const listener = () => {
            this.printNotRegisteredMessage();
        };
        this.logger = logger;
        this.balanceRequired = new AmountRequired_1.AmountRequired('Balance', web3_utils_1.toBN(config.managerMinBalance), logger, listener);
        this.stakeRequired = new AmountRequired_1.AmountRequired('Stake', web3_utils_1.toBN(config.managerMinStake), logger, listener);
        this.contractInteractor = contractInteractor;
        this.hubAddress = config.relayHubAddress;
        this.managerAddress = managerAddress;
        this.workerAddress = workerAddress;
        this.eventEmitter = eventEmitter;
        this.transactionManager = transactionManager;
        this.txStoreManager = txStoreManager;
        this.config = config;
    }
    get isHubAuthorized() {
        return this._isHubAuthorized;
    }
    set isHubAuthorized(newValue) {
        const oldValue = this._isHubAuthorized;
        this._isHubAuthorized = newValue;
        if (newValue !== oldValue) {
            this.logger.info(`Current RelayHub is ${newValue ? 'now' : 'no longer'} authorized`);
            this.printNotRegisteredMessage();
        }
    }
    get isStakeLocked() {
        return this._isStakeLocked;
    }
    set isStakeLocked(newValue) {
        const oldValue = this._isStakeLocked;
        this._isStakeLocked = newValue;
        if (newValue !== oldValue) {
            this.logger.info(`Manager stake is ${newValue ? 'now' : 'no longer'} locked`);
            this.printNotRegisteredMessage();
        }
    }
    async init() {
        if (this.lastWorkerAddedTransaction == null) {
            this.lastWorkerAddedTransaction = await this._queryLatestWorkerAddedEvent();
        }
        if (this.lastMinedRegisterTransaction == null) {
            this.lastMinedRegisterTransaction = await this._queryLatestRegistrationEvent();
        }
        this.isInitialized = true;
    }
    async handlePastEvents(hubEventsSinceLastScan, lastScannedBlock, currentBlock, forceRegistration) {
        if (!this.isInitialized) {
            throw new Error('RegistrationManager not initialized');
        }
        const topics = [Utils_1.address2topic(this.managerAddress)];
        const options = {
            fromBlock: lastScannedBlock + 1,
            toBlock: 'latest'
        };
        const eventNames = [ContractInteractor_1.HubAuthorized, ContractInteractor_1.StakeAdded, ContractInteractor_1.HubUnauthorized, ContractInteractor_1.StakeUnlocked, ContractInteractor_1.StakeWithdrawn];
        const decodedEvents = await this.contractInteractor.getPastEventsForStakeManager(eventNames, topics, options);
        this.printEvents(decodedEvents, options);
        let transactionHashes = [];
        // TODO: what about 'penalize' events? should send balance to owner, I assume
        // TODO TODO TODO 'StakeAdded' is not the event you want to cat upon if there was no 'HubAuthorized' event
        for (const eventData of decodedEvents) {
            switch (eventData.event) {
                case ContractInteractor_1.HubAuthorized:
                    await this._handleHubAuthorizedEvent(eventData);
                    break;
                case ContractInteractor_1.StakeAdded:
                    await this.refreshStake();
                    break;
                case ContractInteractor_1.HubUnauthorized:
                    if (Utils_1.isSameAddress(eventData.returnValues.relayHub, this.hubAddress)) {
                        this.isHubAuthorized = false;
                        this.delayedEvents.push({ block: eventData.returnValues.removalBlock.toString(), eventData });
                    }
                    break;
                case ContractInteractor_1.StakeUnlocked:
                    await this.refreshStake();
                    break;
                case ContractInteractor_1.StakeWithdrawn:
                    await this.refreshStake();
                    transactionHashes = transactionHashes.concat(await this._handleStakeWithdrawnEvent(eventData, currentBlock));
                    break;
            }
        }
        for (const eventData of hubEventsSinceLastScan) {
            switch (eventData.event) {
                case ContractInteractor_1.RelayServerRegistered:
                    if (this.lastMinedRegisterTransaction == null || Utils_1.isSecondEventLater(this.lastMinedRegisterTransaction, eventData)) {
                        this.lastMinedRegisterTransaction = eventData;
                    }
                    break;
                case ContractInteractor_1.RelayWorkersAdded:
                    if (this.lastWorkerAddedTransaction == null || Utils_1.isSecondEventLater(this.lastWorkerAddedTransaction, eventData)) {
                        this.lastWorkerAddedTransaction = eventData;
                    }
                    break;
            }
        }
        // handle HubUnauthorized only after the due time
        for (const eventData of this._extractDuePendingEvents(currentBlock)) {
            switch (eventData.event) {
                case ContractInteractor_1.HubUnauthorized:
                    transactionHashes = transactionHashes.concat(await this._handleHubUnauthorizedEvent(eventData, currentBlock));
                    break;
            }
        }
        const isRegistrationCorrect = await this._isRegistrationCorrect();
        const isRegistrationPending = await this.txStoreManager.isActionPending(StoredTransaction_1.ServerAction.REGISTER_SERVER);
        if (!(isRegistrationPending || isRegistrationCorrect) || forceRegistration) {
            this.logger.debug(`will attempt registration: isRegistrationPending=${isRegistrationPending} isRegistrationCorrect=${isRegistrationCorrect} forceRegistration=${forceRegistration}`);
            transactionHashes = transactionHashes.concat(await this.attemptRegistration(currentBlock));
        }
        return transactionHashes;
    }
    _extractDuePendingEvents(currentBlock) {
        const ret = this.delayedEvents.filter(event => event.block <= currentBlock).map(e => e.eventData);
        this.delayedEvents = [...this.delayedEvents.filter(event => event.block > currentBlock)];
        return ret;
    }
    _isRegistrationCorrect() {
        return Utils_1.isRegistrationValid(this.lastMinedRegisterTransaction, this.config, this.managerAddress);
    }
    async _queryLatestRegistrationEvent() {
        const topics = Utils_1.address2topic(this.managerAddress);
        const registerEvents = await this.contractInteractor.getPastEventsForHub([topics], {
            fromBlock: 1
        }, [ContractInteractor_1.RelayServerRegistered]);
        return Utils_1.getLatestEventData(registerEvents);
    }
    _parseEvent(event) {
        if ((event === null || event === void 0 ? void 0 : event.events) === undefined) {
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            return `not event: ${event === null || event === void 0 ? void 0 : event.toString()}`;
        }
        const args = {};
        // event arguments is for some weird reason give as ".events"
        for (const eventArgument of event.events) {
            args[eventArgument.name] = eventArgument.value;
        }
        return {
            name: event.name,
            address: event.address,
            args: args
        };
    }
    async _handleHubAuthorizedEvent(dlog) {
        if (dlog.returnValues.relayHub.toLowerCase() === this.hubAddress.toLowerCase()) {
            this.isHubAuthorized = true;
        }
    }
    async _handleHubUnauthorizedEvent(dlog, currentBlock) {
        return await this.withdrawAllFunds(false, currentBlock);
    }
    async _handleStakeWithdrawnEvent(dlog, currentBlock) {
        this.logger.warn(`Handling StakeWithdrawn event: ${JSON.stringify(dlog)}`);
        return await this.withdrawAllFunds(true, currentBlock);
    }
    /**
     * @param withdrawManager - whether to send the relay manager's balance to the owner.
     *        Note that more than one relay process could be using the same manager account.
     * @param currentBlock
     */
    async withdrawAllFunds(withdrawManager, currentBlock) {
        let transactionHashes = [];
        transactionHashes = transactionHashes.concat(await this._sendManagerHubBalanceToOwner(currentBlock));
        transactionHashes = transactionHashes.concat(await this._sendWorkersEthBalancesToOwner(currentBlock));
        if (withdrawManager) {
            transactionHashes = transactionHashes.concat(await this._sendManagerEthBalanceToOwner(currentBlock));
        }
        this.eventEmitter.emit('unstaked');
        return transactionHashes;
    }
    async refreshBalance() {
        const currentBalance = await this.contractInteractor.getBalance(this.managerAddress);
        this.balanceRequired.currentValue = web3_utils_1.toBN(currentBalance);
    }
    async refreshStake() {
        const stakeInfo = await this.contractInteractor.getStakeInfo(this.managerAddress);
        const stake = web3_utils_1.toBN(stakeInfo.stake);
        if (stake.eq(web3_utils_1.toBN(0))) {
            return;
        }
        // a locked stake does not have the 'withdrawBlock' field set
        this.isStakeLocked = stakeInfo.withdrawBlock === '0';
        this.stakeRequired.currentValue = stake;
        // first time getting stake, setting owner
        if (this.ownerAddress == null) {
            this.ownerAddress = stakeInfo.owner;
            this.logger.info('Got staked for the first time');
            this.printNotRegisteredMessage();
        }
    }
    async addRelayWorker(currentBlock) {
        // register on chain
        const addRelayWorkerMethod = await this.contractInteractor.getAddRelayWorkersMethod([this.workerAddress]);
        const gasLimit = await this.transactionManager.attemptEstimateGas('AddRelayWorkers', addRelayWorkerMethod, this.managerAddress);
        const details = {
            signer: this.managerAddress,
            gasLimit,
            serverAction: StoredTransaction_1.ServerAction.ADD_WORKER,
            method: addRelayWorkerMethod,
            destination: this.hubAddress,
            creationBlockNumber: currentBlock
        };
        this.logger.info(`adding relay worker ${this.workerAddress}`);
        const { transactionHash } = await this.transactionManager.sendTransaction(details);
        return transactionHash;
    }
    // TODO: extract worker registration sub-flow
    async attemptRegistration(currentBlock) {
        const allPrerequisitesOk = this.isHubAuthorized &&
            this.isStakeLocked &&
            this.stakeRequired.isSatisfied &&
            this.balanceRequired.isSatisfied;
        if (!allPrerequisitesOk) {
            this.logger.debug('will not actually attempt registration - prerequisites not satisfied');
            return [];
        }
        let transactions = [];
        // add worker only if not already added
        const workersAdded = await this._isWorkerValid();
        const addWorkersPending = await this.txStoreManager.isActionPending(StoredTransaction_1.ServerAction.ADD_WORKER);
        if (!(workersAdded || addWorkersPending)) {
            const txHash = await this.addRelayWorker(currentBlock);
            transactions = transactions.concat(txHash);
        }
        const registerMethod = await this.contractInteractor.getRegisterRelayMethod(this.config.baseRelayFee, this.config.pctRelayFee, this.config.url);
        const gasLimit = await this.transactionManager.attemptEstimateGas('RegisterRelay', registerMethod, this.managerAddress);
        const details = {
            serverAction: StoredTransaction_1.ServerAction.REGISTER_SERVER,
            gasLimit,
            signer: this.managerAddress,
            method: registerMethod,
            destination: this.hubAddress,
            creationBlockNumber: currentBlock
        };
        const { transactionHash } = await this.transactionManager.sendTransaction(details);
        transactions = transactions.concat(transactionHash);
        this.logger.debug(`Relay ${this.managerAddress} registered on hub ${this.hubAddress}. `);
        return transactions;
    }
    async _sendManagerEthBalanceToOwner(currentBlock) {
        const gasPrice = await this.contractInteractor.getGasPrice();
        const transactionHashes = [];
        const gasLimit = mintxgascost;
        const txCost = web3_utils_1.toBN(gasLimit).mul(web3_utils_1.toBN(gasPrice));
        const managerBalance = web3_utils_1.toBN(await this.contractInteractor.getBalance(this.managerAddress));
        // sending manager eth balance to owner
        if (managerBalance.gte(txCost)) {
            this.logger.info(`Sending manager eth balance ${managerBalance.toString()} to owner`);
            const details = {
                signer: this.managerAddress,
                serverAction: StoredTransaction_1.ServerAction.VALUE_TRANSFER,
                destination: this.ownerAddress,
                gasLimit,
                gasPrice,
                value: web3_utils_1.toHex(managerBalance.sub(txCost)),
                creationBlockNumber: currentBlock
            };
            const { transactionHash } = await this.transactionManager.sendTransaction(details);
            transactionHashes.push(transactionHash);
        }
        else {
            this.logger.error(`manager balance too low: ${managerBalance.toString()}, tx cost: ${gasLimit * parseInt(gasPrice)}`);
        }
        return transactionHashes;
    }
    async _sendWorkersEthBalancesToOwner(currentBlock) {
        // sending workers' balance to owner (currently one worker, todo: extend to multiple)
        const transactionHashes = [];
        const gasPrice = await this.contractInteractor.getGasPrice();
        const gasLimit = mintxgascost;
        const txCost = web3_utils_1.toBN(gasLimit * parseInt(gasPrice));
        const workerBalance = web3_utils_1.toBN(await this.contractInteractor.getBalance(this.workerAddress));
        if (workerBalance.gte(txCost)) {
            this.logger.info(`Sending workers' eth balance ${workerBalance.toString()} to owner`);
            const details = {
                signer: this.workerAddress,
                serverAction: StoredTransaction_1.ServerAction.VALUE_TRANSFER,
                destination: this.ownerAddress,
                gasLimit,
                gasPrice,
                value: web3_utils_1.toHex(workerBalance.sub(txCost)),
                creationBlockNumber: currentBlock
            };
            const { transactionHash } = await this.transactionManager.sendTransaction(details);
            transactionHashes.push(transactionHash);
        }
        else {
            this.logger.info(`balance too low: ${workerBalance.toString()}, tx cost: ${gasLimit * parseInt(gasPrice)}`);
        }
        return transactionHashes;
    }
    async _sendManagerHubBalanceToOwner(currentBlock) {
        if (this.ownerAddress == null) {
            throw new Error('Owner address not initialized');
        }
        const transactionHashes = [];
        const gasPrice = await this.contractInteractor.getGasPrice();
        const managerHubBalance = await this.contractInteractor.hubBalanceOf(this.managerAddress);
        const { gasLimit, gasCost, method } = await this.contractInteractor.withdrawHubBalanceEstimateGas(managerHubBalance, this.ownerAddress, this.managerAddress, gasPrice);
        if (managerHubBalance.gte(gasCost)) {
            this.logger.info(`Sending manager hub balance ${managerHubBalance.toString()} to owner`);
            const details = {
                gasLimit,
                signer: this.managerAddress,
                serverAction: StoredTransaction_1.ServerAction.DEPOSIT_WITHDRAWAL,
                destination: this.hubAddress,
                creationBlockNumber: currentBlock,
                method
            };
            const { transactionHash } = await this.transactionManager.sendTransaction(details);
            transactionHashes.push(transactionHash);
        }
        else {
            this.logger.error(`manager hub balance too low: ${managerHubBalance.toString()}, tx cost: ${gasCost.toString()}`);
        }
        return transactionHashes;
    }
    async _queryLatestWorkerAddedEvent() {
        const workersAddedEvents = await this.contractInteractor.getPastEventsForHub([Utils_1.address2topic(this.managerAddress)], {
            fromBlock: 1
        }, [ContractInteractor_1.RelayWorkersAdded]);
        return Utils_1.getLatestEventData(workersAddedEvents);
    }
    _isWorkerValid() {
        // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
        return this.lastWorkerAddedTransaction != null && this.lastWorkerAddedTransaction.returnValues.newRelayWorkers
            .map((a) => a.toLowerCase()).includes(this.workerAddress.toLowerCase());
    }
    async isRegistered() {
        const isRegistrationCorrect = await this._isRegistrationCorrect();
        return this.stakeRequired.isSatisfied &&
            this.isStakeLocked &&
            this.isHubAuthorized &&
            isRegistrationCorrect;
    }
    printNotRegisteredMessage() {
        var _a;
        if (this._isRegistrationCorrect()) {
            return;
        }
        const message = `\nNot registered yet. Prerequisites:
${this.balanceRequired.description}
${this.stakeRequired.description}
Hub authorized | ${Utils_1.boolString(this.isHubAuthorized)}
Stake locked   | ${Utils_1.boolString(this.isStakeLocked)}
Manager        | ${this.managerAddress}
Worker         | ${this.workerAddress}
Owner          | ${(_a = this.ownerAddress) !== null && _a !== void 0 ? _a : chalk_1.default.red('unknown')}
`;
        this.logger.info(message);
    }
    printEvents(decodedEvents, options) {
        var _a;
        if (decodedEvents.length === 0) {
            return;
        }
        this.logger.info(`Handling ${decodedEvents.length} events emitted since block: ${(_a = options.fromBlock) === null || _a === void 0 ? void 0 : _a.toString()}`);
        for (const decodedEvent of decodedEvents) {
            this.logger.info(`
Name      | ${decodedEvent.event.padEnd(25)}
Block     | ${decodedEvent.blockNumber}
TxHash    | ${decodedEvent.transactionHash}
`);
        }
    }
}
exports.RegistrationManager = RegistrationManager;
//# sourceMappingURL=RegistrationManager.js.map