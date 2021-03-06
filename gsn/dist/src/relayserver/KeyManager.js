"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-ignore
const ethereumjs_wallet_1 = __importDefault(require("ethereumjs-wallet"));
// @ts-ignore
const hdkey_1 = __importDefault(require("ethereumjs-wallet/hdkey"));
const fs_1 = __importDefault(require("fs"));
const ow_1 = __importDefault(require("ow"));
const web3_utils_1 = require("web3-utils");
exports.KEYSTORE_FILENAME = 'keystore';
class KeyManager {
    /**
     * @param count - # of addresses managed by this manager
     * @param workdir - read seed from keystore file (or generate one and write it)
     * @param seed - if working in memory (no workdir), you can specify a seed - or use randomly generated one.
     */
    constructor(count, workdir, seed) {
        this._privateKeys = {};
        this.nonces = {};
        ow_1.default(count, ow_1.default.number);
        if (seed != null && workdir != null) {
            throw new Error('Can\'t specify both seed and workdir');
        }
        if (workdir != null) {
            // @ts-ignore
            try {
                if (!fs_1.default.existsSync(workdir)) {
                    fs_1.default.mkdirSync(workdir, { recursive: true });
                }
                let genseed;
                const keyStorePath = workdir + '/' + exports.KEYSTORE_FILENAME;
                if (fs_1.default.existsSync(keyStorePath)) {
                    genseed = JSON.parse(fs_1.default.readFileSync(keyStorePath).toString()).seed;
                }
                else {
                    genseed = ethereumjs_wallet_1.default.generate().getPrivateKey().toString('hex');
                    fs_1.default.writeFileSync(keyStorePath, JSON.stringify({ seed: genseed }), { flag: 'w' });
                }
                this.hdkey = hdkey_1.default.fromMasterSeed(genseed);
            }
            catch (e) {
                // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
                if (!e.message.includes('file already exists')) {
                    throw e;
                }
            }
        }
        else {
            // no workdir: working in-memory
            if (seed == null) {
                seed = ethereumjs_wallet_1.default.generate().getPrivateKey().toString('hex');
            }
            this.hdkey = hdkey_1.default.fromMasterSeed(seed);
        }
        this.generateKeys(count);
    }
    generateKeys(count) {
        this._privateKeys = {};
        this.nonces = {};
        for (let index = 0; index < count; index++) {
            const w = this.hdkey.deriveChild(index).getWallet();
            const address = web3_utils_1.toHex(w.getAddress());
            this._privateKeys[address] = w.privKey;
            this.nonces[index] = 0;
        }
    }
    getAddress(index) {
        return this.getAddresses()[index];
    }
    getAddresses() {
        return Object.keys(this._privateKeys);
    }
    isSigner(signer) {
        return this._privateKeys[signer] != null;
    }
    signTransaction(signer, tx) {
        ow_1.default(signer, ow_1.default.string);
        const privateKey = this._privateKeys[signer];
        if (privateKey === undefined) {
            throw new Error(`Can't sign: signer=${signer} is not managed`);
        }
        tx.sign(privateKey);
        const rawTx = '0x' + tx.serialize().toString('hex');
        return rawTx;
    }
}
exports.KeyManager = KeyManager;
//# sourceMappingURL=KeyManager.js.map