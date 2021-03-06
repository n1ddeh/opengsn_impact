"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-ignore
const abi_decoder_1 = __importDefault(require("abi-decoder"));
const IRelayHub_json_1 = __importDefault(require("../common/interfaces/IRelayHub.json"));
const RelayClient_1 = require("./RelayClient");
abi_decoder_1.default.addABI(IRelayHub_json_1.default);
// TODO: stop faking the HttpProvider implementation -  it won't work for any other 'origProvider' type
class RelayProvider {
    constructor(relayClient) {
        if (relayClient.send != null) {
            throw new Error('Using new RelayProvider() constructor directly is deprecated.\nPlease create provider using RelayProvider.newProvider({})');
        }
        this.relayClient = relayClient;
        // TODO: stop faking the HttpProvider implementation
        this.origProvider = this.relayClient.getUnderlyingProvider();
        this.host = this.origProvider.host;
        this.connected = this.origProvider.connected;
        if (typeof this.origProvider.sendAsync === 'function') {
            this.origProviderSend = this.origProvider.sendAsync.bind(this.origProvider);
        }
        else {
            this.origProviderSend = this.origProvider.send.bind(this.origProvider);
        }
        this._delegateEventsApi();
    }
    static newProvider(input) {
        return new RelayProvider(new RelayClient_1.RelayClient(input));
    }
    async init() {
        await this.relayClient.init();
        this.config = this.relayClient.config;
        this.logger = this.relayClient.logger;
        return this;
    }
    registerEventListener(handler) {
        this.relayClient.registerEventListener(handler);
    }
    unregisterEventListener(handler) {
        this.relayClient.unregisterEventListener(handler);
    }
    _delegateEventsApi() {
        // If the subprovider is a ws or ipc provider, then register all its methods on this provider
        // and delegate calls to the subprovider. This allows subscriptions to work.
        ['on', 'removeListener', 'removeAllListeners', 'reset', 'disconnect', 'addDefaultEvents', 'once', 'reconnect'].forEach(func => {
            // @ts-ignore
            if (this.origProvider[func] !== undefined) {
                // @ts-ignore
                this[func] = this.origProvider[func].bind(this.origProvider);
            }
        });
    }
    send(payload, callback) {
        if (this._useGSN(payload)) {
            if (payload.method === 'eth_sendTransaction') {
                if (payload.params[0].to === undefined) {
                    throw new Error('GSN cannot relay contract deployment transactions. Add {from: accountWithEther, useGSN: false}.');
                }
                this._ethSendTransaction(payload, callback);
                return;
            }
            if (payload.method === 'eth_getTransactionReceipt') {
                this._ethGetTransactionReceipt(payload, callback);
                return;
            }
            if (payload.method === 'eth_accounts') {
                this._getAccounts(payload, callback);
            }
        }
        this.origProviderSend(payload, (error, result) => {
            callback(error, result);
        });
    }
    _ethGetTransactionReceipt(payload, callback) {
        this.logger.info('calling sendAsync' + JSON.stringify(payload));
        this.origProviderSend(payload, (error, rpcResponse) => {
            // Sometimes, ganache seems to return 'false' for 'no error' (breaking TypeScript declarations)
            // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
            if (error) {
                callback(error, rpcResponse);
                return;
            }
            if (rpcResponse == null || rpcResponse.result == null) {
                callback(error, rpcResponse);
                return;
            }
            rpcResponse.result = this._getTranslatedGsnResponseResult(rpcResponse.result);
            callback(error, rpcResponse);
        });
    }
    _ethSendTransaction(payload, callback) {
        this.logger.info('calling sendAsync' + JSON.stringify(payload));
        const gsnTransactionDetails = payload.params[0];
        this.relayClient.relayTransaction(gsnTransactionDetails)
            .then((relayingResult) => {
            if (relayingResult.transaction != null) {
                const jsonRpcSendResult = this._convertTransactionToRpcSendResponse(relayingResult.transaction, payload);
                callback(null, jsonRpcSendResult);
            }
            else {
                const message = `Failed to relay call. Results:\n${RelayClient_1._dumpRelayingResult(relayingResult)}`;
                this.logger.error(message);
                callback(new Error(message));
            }
        }, (reason) => {
            const reasonStr = reason instanceof Error ? reason.message : JSON.stringify(reason);
            const msg = `Rejected relayTransaction call with reason: ${reasonStr}`;
            this.logger.info(msg);
            callback(new Error(msg));
        });
    }
    _convertTransactionToRpcSendResponse(transaction, request) {
        var _a;
        const txHash = transaction.hash(true).toString('hex');
        const hash = `0x${txHash}`;
        const id = (_a = (typeof request.id === 'string' ? parseInt(request.id) : request.id)) !== null && _a !== void 0 ? _a : -1;
        return {
            jsonrpc: '2.0',
            id,
            result: hash
        };
    }
    _getTranslatedGsnResponseResult(respResult) {
        const fixedTransactionReceipt = Object.assign({}, respResult);
        if (respResult.logs.length === 0) {
            return fixedTransactionReceipt;
        }
        const logs = abi_decoder_1.default.decodeLogs(respResult.logs);
        const paymasterRejectedEvents = logs.find((e) => e != null && e.name === 'TransactionRejectedByPaymaster');
        if (paymasterRejectedEvents !== null && paymasterRejectedEvents !== undefined) {
            const paymasterRejectionReason = paymasterRejectedEvents.events.find((e) => e.name === 'reason');
            if (paymasterRejectionReason !== undefined) {
                this.logger.info(`Paymaster rejected on-chain: ${paymasterRejectionReason.value}. changing status to zero`);
                fixedTransactionReceipt.status = '0';
            }
            return fixedTransactionReceipt;
        }
        const transactionRelayed = logs.find((e) => e != null && e.name === 'TransactionRelayed');
        if (transactionRelayed != null) {
            const transactionRelayedStatus = transactionRelayed.events.find((e) => e.name === 'status');
            if (transactionRelayedStatus !== undefined) {
                const status = transactionRelayedStatus.value.toString();
                // 0 signifies success
                if (status !== '0') {
                    this.logger.info(`reverted relayed transaction, status code ${status}. changing status to zero`);
                    fixedTransactionReceipt.status = '0';
                }
            }
        }
        return fixedTransactionReceipt;
    }
    _useGSN(payload) {
        var _a;
        if (payload.method === 'eth_accounts') {
            return true;
        }
        if (payload.params[0] === undefined) {
            return false;
        }
        const gsnTransactionDetails = payload.params[0];
        return (_a = gsnTransactionDetails === null || gsnTransactionDetails === void 0 ? void 0 : gsnTransactionDetails.useGSN) !== null && _a !== void 0 ? _a : true;
    }
    supportsSubscriptions() {
        return this.origProvider.supportsSubscriptions();
    }
    disconnect() {
        return this.origProvider.disconnect();
    }
    newAccount() {
        return this.relayClient.newAccount();
    }
    addAccount(privateKey) {
        this.relayClient.addAccount(privateKey);
    }
    _getAccounts(payload, callback) {
        this.origProviderSend(payload, (error, rpcResponse) => {
            if (rpcResponse != null && Array.isArray(rpcResponse.result)) {
                const ephemeralAccounts = this.relayClient.dependencies.accountManager.getAccounts();
                rpcResponse.result = rpcResponse.result.concat(ephemeralAccounts);
            }
            callback(error, rpcResponse);
        });
    }
}
exports.RelayProvider = RelayProvider;
//# sourceMappingURL=RelayProvider.js.map