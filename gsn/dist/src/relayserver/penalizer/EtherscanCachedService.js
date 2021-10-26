"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const Utils_1 = require("../../common/Utils");
class EtherscanCachedService {
    constructor(url, etherscanApiKey, logger, transactionDataCache) {
        this.url = url;
        this.etherscanApiKey = etherscanApiKey;
        this.logger = logger;
        this.transactionDataCache = transactionDataCache;
    }
    async getTransactionByNonce(address, nonce) {
        const { transaction, lastPageQueried } = await this.queryCachedTransactions(address, nonce);
        if (transaction != null) {
            return transaction;
        }
        return await this.searchTransactionEtherscan(address, nonce, lastPageQueried);
    }
    async searchTransactionEtherscan(address, nonce, lastPageQueried) {
        const pageSize = 10;
        let page = lastPageQueried + 1;
        let response;
        do {
            const params = {
                params: {
                    address,
                    page,
                    apikey: this.etherscanApiKey,
                    offset: pageSize,
                    action: 'txlist',
                    module: 'account',
                    sort: 'asc',
                    startblock: 0,
                    endblock: 99999999
                }
            };
            response = await axios_1.default.get(this.url, params);
            if (response.data.result == null || response.data.result.filter == null) {
                throw new Error(`Failed to query ${this.url}: returned ${response.data.status} ${response.data.message}`);
            }
            else if (response.data.status !== '0') {
                this.logger.warn(`Request to ${this.url} returned with ${response.data.status} ${response.data.message}`);
            }
            const outgoingTransactions = response.data.result.filter((it) => Utils_1.isSameAddress(it.from, address));
            await this.cacheResponse(outgoingTransactions, address, page);
            const transaction = outgoingTransactions.find((it) => parseInt(it.nonce) === nonce);
            if (transaction != null) {
                return transaction;
            }
            page++;
        } while (response.data.result.length >= pageSize);
        return undefined;
    }
    async queryCachedTransactions(address, nonce) {
        const transaction = await this.transactionDataCache.getTransactionByNonce(address, nonce);
        const lastPageQueried = await this.transactionDataCache.getLastPageQueried(address);
        return { transaction, lastPageQueried };
    }
    async cacheResponse(transactions, sender, page) {
        await this.transactionDataCache.putTransactions(transactions, sender, page);
    }
}
exports.EtherscanCachedService = EtherscanCachedService;
//# sourceMappingURL=EtherscanCachedService.js.map