"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-ignore
const ethereumjs_wallet_1 = __importDefault(require("ethereumjs-wallet"));
const web3_1 = __importDefault(require("web3"));
const eth_sig_util_1 = __importDefault(require("eth-sig-util"));
const TypedRequestData_1 = require("@opengsn/common/dist/EIP712/TypedRequestData");
const Utils_1 = require("@opengsn/common/dist/Utils");
function toAddress(privateKey) {
    const wallet = ethereumjs_wallet_1.default.fromPrivateKey(Buffer.from(Utils_1.removeHexPrefix(privateKey), 'hex'));
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    return `0x${wallet.getAddress().toString('hex')}`;
}
class AccountManager {
    constructor(provider, chainId, config) {
        this.accounts = [];
        this.web3 = new web3_1.default(provider);
        this.chainId = chainId;
        this.config = config;
    }
    addAccount(privateKey) {
        // TODO: backwards-compatibility 101 - remove on next version bump
        // addAccount used to accept AccountKeypair with Buffer in it
        // @ts-ignore
        // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
        if (privateKey.privateKey) {
            console.error('ERROR: addAccount accepts a private key as a prefixed hex string now!');
            // @ts-ignore
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            privateKey = `0x${privateKey.privateKey.toString('hex')}`;
        }
        const address = toAddress(privateKey);
        const keypair = {
            privateKey,
            address
        };
        this.accounts.push(keypair);
    }
    newAccount() {
        const a = ethereumjs_wallet_1.default.generate();
        const privateKey = `0x${a.privKey.toString('hex')}`;
        this.addAccount(privateKey);
        const address = toAddress(privateKey);
        return {
            privateKey,
            address
        };
    }
    async sign(relayRequest) {
        let signature;
        const forwarder = relayRequest.relayData.forwarder;
        const cloneRequest = Object.assign({}, relayRequest);
        const signedData = new TypedRequestData_1.TypedRequestData(this.chainId, forwarder, cloneRequest);
        const keypair = this.accounts.find(account => Utils_1.isSameAddress(account.address, relayRequest.request.from));
        let rec;
        try {
            if (keypair != null) {
                signature = this._signWithControlledKey(keypair.privateKey, signedData);
            }
            else {
                signature = await this._signWithProvider(signedData);
            }
            // Sanity check only
            // @ts-ignore
            rec = eth_sig_util_1.default.recoverTypedSignature_v4({
                // @ts-ignore
                data: signedData,
                sig: signature
            });
        }
        catch (error) {
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            throw new Error(`Failed to sign relayed transaction for ${relayRequest.request.from}: ${error}`);
        }
        if (!Utils_1.isSameAddress(relayRequest.request.from.toLowerCase(), rec)) {
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            throw new Error(`Internal RelayClient exception: signature is not correct: sender=${relayRequest.request.from}, recovered=${rec}`);
        }
        return signature;
    }
    // These methods is extracted to
    // a) allow different implementations in the future, and
    // b) allow spying on Account Manager in tests
    async _signWithProvider(signedData) {
        var _a, _b;
        return await Utils_1.getEip712Signature(this.web3, signedData, (_a = this.config.methodSuffix) !== null && _a !== void 0 ? _a : '', (_b = this.config.jsonStringifyRequest) !== null && _b !== void 0 ? _b : false);
    }
    _signWithControlledKey(privateKey, signedData) {
        // @ts-ignore
        return eth_sig_util_1.default.signTypedData_v4(Buffer.from(Utils_1.removeHexPrefix(privateKey), 'hex'), { data: signedData });
    }
    getAccounts() {
        return this.accounts.map(it => it.address);
    }
}
exports.AccountManager = AccountManager;
//# sourceMappingURL=AccountManager.js.map