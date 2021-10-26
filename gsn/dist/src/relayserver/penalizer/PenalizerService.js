"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-ignore
const abi_decoder_1 = __importDefault(require("abi-decoder"));
const ethereumjs_tx_1 = require("ethereumjs-tx");
const ethereumjs_util_1 = require("ethereumjs-util");
const IPaymaster_json_1 = __importDefault(require("../../common/interfaces/IPaymaster.json"));
const IRelayHub_json_1 = __importDefault(require("../../common/interfaces/IRelayHub.json"));
const IStakeManager_json_1 = __importDefault(require("../../common/interfaces/IStakeManager.json"));
const VersionsManager_1 = __importDefault(require("../../common/VersionsManager"));
const ErrorReplacerJSON_1 = __importDefault(require("../../common/ErrorReplacerJSON"));
const StoredTransaction_1 = require("../StoredTransaction");
const Utils_1 = require("../../common/Utils");
const Version_1 = require("../../common/Version");
abi_decoder_1.default.addABI(IRelayHub_json_1.default);
abi_decoder_1.default.addABI(IPaymaster_json_1.default);
abi_decoder_1.default.addABI(IStakeManager_json_1.default);
const INVALID_SIGNATURE = 'Transaction does not have a valid signature';
const UNKNOWN_WORKER = 'Transaction is sent by an unknown worker';
const UNSTAKED_RELAY = 'Transaction is sent by an unstaked relay';
const MINED_TRANSACTION = 'Transaction is the one mined on the current chain and no conflicting transaction is known to this server';
const NONCE_FORWARD = 'Transaction nonce is higher then current account nonce and no conflicting transaction is known to this server';
function createWeb3Transaction(transaction, rawTxOptions) {
    var _a;
    const gasPrice = '0x' + BigInt(transaction.gasPrice).toString(16);
    const value = '0x' + BigInt(transaction.value).toString(16);
    const txData = {
        gasLimit: transaction.gas,
        gasPrice,
        to: (_a = transaction.to) !== null && _a !== void 0 ? _a : '',
        data: transaction.input,
        nonce: transaction.nonce,
        value,
        // @ts-ignore
        v: transaction.v,
        // @ts-ignore
        r: transaction.r,
        // @ts-ignore
        s: transaction.s
    };
    return new ethereumjs_tx_1.Transaction(txData, rawTxOptions);
}
class PenalizerService {
    constructor(params, logger, config) {
        var _a;
        this.initialized = false;
        this.transactionManager = params.transactionManager;
        this.contractInteractor = params.contractInteractor;
        this.versionManager = new VersionsManager_1.default(Version_1.gsnRuntimeVersion, (_a = config.requiredVersionRange) !== null && _a !== void 0 ? _a : Version_1.gsnRequiredVersion);
        this.config = config;
        this.txByNonceService = params.txByNonceService;
        this.managerAddress = this.transactionManager.managerKeyManager.getAddress(0);
        this.logger = logger;
    }
    async init() {
        if (this.initialized) {
            return;
        }
        this.logger.info('Penalizer service initialized');
        this.initialized = true;
    }
    async penalizeRepeatedNonce(req) {
        if (!this.initialized) {
            throw new Error('PenalizerService is not initialized');
        }
        if (this.config.etherscanApiUrl.length === 0) {
            return {
                message: 'Etherscan API URL is not set on this server!'
            };
        }
        this.logger.info(`Validating tx ${req.signedTx}`);
        // deserialize the tx
        const rawTxOptions = this.contractInteractor.getRawTxOptions();
        const requestTx = new ethereumjs_tx_1.Transaction(req.signedTx, rawTxOptions);
        const validationResult = await this.validateTransaction(requestTx);
        if (!validationResult.valid) {
            return {
                message: validationResult.error
            };
        }
        const isMinedTx = await this.isTransactionMined(requestTx);
        if (isMinedTx) {
            return {
                message: MINED_TRANSACTION
            };
        }
        const relayWorker = ethereumjs_util_1.bufferToHex(requestTx.getSenderAddress());
        // read the relay worker's nonce from blockchain
        const currentNonce = await this.contractInteractor.getTransactionCount(relayWorker, 'pending');
        // if tx nonce > current nonce, publish tx and await
        // otherwise, get mined tx with same nonce. if equals (up to different gasPrice) to received tx, return.
        // Otherwise, penalize.
        const transactionNonce = ethereumjs_util_1.bufferToInt(requestTx.nonce);
        if (transactionNonce > currentNonce) {
            // TODO: store it, and see how sender behaves later...
            //  also, if we have already stored some transaction for this sender, check if these two are in nonce conflict.
            //  this flow has nothing to do with this particular penalization, so just default to 'storeTxForLater' or something
            return {
                message: NONCE_FORWARD
            };
        }
        // run penalize in view mode to see if penalizable
        const minedTransactionData = await this.txByNonceService.getTransactionByNonce(relayWorker, transactionNonce);
        if (minedTransactionData == null) {
            throw Error(`TxByNonce service failed to fetch tx with nonce ${transactionNonce} of relayer ${relayWorker}`);
        }
        const minedTx = await this.contractInteractor.getTransaction(minedTransactionData.hash);
        if (minedTx == null) {
            throw Error(`Failed to get transaction ${minedTransactionData.hash} from node`);
        }
        const minedTxBuffers = createWeb3Transaction(minedTx, rawTxOptions);
        const method = this.getPenalizeRepeatedNonceMethod(minedTxBuffers, requestTx);
        const isValidPenalization = await this.validatePenalization(method);
        if (!isValidPenalization.valid) {
            return {
                message: isValidPenalization.error
            };
        }
        const penalizeTxHash = await this.executePenalization('penalizeRepeatedNonce', method);
        return { penalizeTxHash };
    }
    async penalizeIllegalTransaction(req) {
        const rawTxOptions = this.contractInteractor.getRawTxOptions();
        const requestTx = new ethereumjs_tx_1.Transaction(req.signedTx, rawTxOptions);
        const validationResult = await this.validateTransaction(requestTx);
        if (!validationResult.valid) {
            return {
                message: validationResult.error
            };
        }
        const method = this.getPenalizeIllegalTransactionMethod(requestTx);
        const isValidPenalization = await this.validatePenalization(method);
        if (!isValidPenalization.valid) {
            return {
                message: isValidPenalization.error
            };
        }
        const penalizeTxHash = await this.executePenalization('penalizeIllegalTransaction', method);
        return { penalizeTxHash };
    }
    async executePenalization(methodName, method) {
        const gasLimit = await this.transactionManager.attemptEstimateGas(methodName, method, this.managerAddress);
        const creationBlockNumber = await this.contractInteractor.getBlockNumber();
        const serverAction = StoredTransaction_1.ServerAction.PENALIZATION;
        const { signedTx, transactionHash } = await this.transactionManager.sendTransaction({
            signer: this.managerAddress,
            method,
            destination: this.contractInteractor.penalizerInstance.address,
            gasLimit,
            creationBlockNumber,
            serverAction
        });
        this.logger.debug(`penalization raw tx: ${signedTx} txHash: ${transactionHash}`);
        return transactionHash;
    }
    getPenalizeIllegalTransactionMethod(requestTx) {
        const chainId = this.contractInteractor.chainId;
        const { data, signature } = Utils_1.getDataAndSignature(requestTx, chainId);
        return this.contractInteractor.penalizerInstance.contract.methods.penalizeIllegalTransaction(data, signature, this.contractInteractor.relayHubInstance.address);
    }
    getPenalizeRepeatedNonceMethod(minedTx, requestTx) {
        const chainId = this.contractInteractor.chainId;
        const { data: unsignedMinedTx, signature: minedTxSig } = Utils_1.getDataAndSignature(minedTx, chainId);
        const { data: unsignedRequestTx, signature: requestTxSig } = Utils_1.getDataAndSignature(requestTx, chainId);
        return this.contractInteractor.penalizerInstance.contract.methods.penalizeRepeatedNonce(unsignedRequestTx, requestTxSig, unsignedMinedTx, minedTxSig, this.contractInteractor.relayHubInstance.address);
    }
    async validateTransaction(requestTx) {
        const txHash = requestTx.hash(true).toString('hex');
        if (!requestTx.verifySignature()) {
            return {
                valid: false,
                error: INVALID_SIGNATURE
            };
        }
        const relayWorker = ethereumjs_util_1.bufferToHex(requestTx.getSenderAddress());
        const relayManager = await this.contractInteractor.relayHubInstance.workerToManager(relayWorker);
        if (ethereumjs_util_1.isZeroAddress(relayManager)) {
            return {
                valid: false,
                error: UNKNOWN_WORKER
            };
        }
        const staked = await this.contractInteractor.relayHubInstance.isRelayManagerStaked(relayManager);
        if (!staked) {
            return {
                valid: false,
                error: UNSTAKED_RELAY
            };
        }
        this.logger.info(`Transaction ${txHash} is valid`);
        return { valid: true };
    }
    async isTransactionMined(requestTx) {
        const txFromNode = await this.contractInteractor.getTransaction(ethereumjs_util_1.bufferToHex(requestTx.hash(true)));
        return txFromNode != null;
    }
    async validatePenalization(method) {
        try {
            const res = await method.call({
                from: this.managerAddress
            });
            this.logger.debug(`res is ${JSON.stringify(res)}`);
            return {
                valid: true
            };
        }
        catch (e) {
            const error = e instanceof Error ? e.message : JSON.stringify(e, ErrorReplacerJSON_1.default);
            this.logger.debug(`view call to penalizeRepeatedNonce reverted with error message ${error}.\nTx not penalizable.`);
            return {
                valid: false,
                error
            };
        }
    }
}
exports.PenalizerService = PenalizerService;
//# sourceMappingURL=PenalizerService.js.map