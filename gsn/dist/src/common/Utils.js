"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const bn_js_1 = __importDefault(require("bn.js"));
const web3_eth_abi_1 = __importDefault(require("web3-eth-abi"));
const web3_utils_1 = __importStar(require("web3-utils"));
const ethereumjs_tx_1 = require("ethereumjs-tx");
const ethereumjs_util_1 = require("ethereumjs-util");
const chalk_1 = __importDefault(require("chalk"));
const rlp_1 = require("rlp");
function removeHexPrefix(hex) {
    if (hex == null || typeof hex.replace !== 'function') {
        throw new Error('Cannot remove hex prefix');
    }
    return hex.replace(/^0x/, '');
}
exports.removeHexPrefix = removeHexPrefix;
const zeroPad = '0000000000000000000000000000000000000000000000000000000000000000';
function padTo64(hex) {
    if (hex.length < 64) {
        hex = (zeroPad + hex).slice(-64);
    }
    return hex;
}
exports.padTo64 = padTo64;
function event2topic(contract, names) {
    // for testing: don't crash on mockup..
    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    if (!contract.options || !contract.options.jsonInterface) {
        return names;
    }
    if (typeof names === 'string') {
        return event2topic(contract, [names])[0];
    }
    return contract.options.jsonInterface
        .filter((e) => names.includes(e.name))
        // @ts-ignore
        .map(web3_eth_abi_1.default.encodeEventSignature);
}
exports.event2topic = event2topic;
function addresses2topics(addresses) {
    return addresses.map(address2topic);
}
exports.addresses2topics = addresses2topics;
function address2topic(address) {
    return '0x' + '0'.repeat(24) + address.toLowerCase().slice(2);
}
exports.address2topic = address2topic;
// extract revert reason from a revert bytes array.
function decodeRevertReason(revertBytes, throwOnError = false) {
    if (revertBytes == null) {
        return null;
    }
    if (!revertBytes.startsWith('0x08c379a0')) {
        if (throwOnError) {
            throw new Error('invalid revert bytes: ' + revertBytes);
        }
        return revertBytes;
    }
    // @ts-ignore
    return web3_eth_abi_1.default.decodeParameter('string', '0x' + revertBytes.slice(10));
}
exports.decodeRevertReason = decodeRevertReason;
async function getEip712Signature(web3, typedRequestData, methodSuffix = '', jsonStringifyRequest = false) {
    const senderAddress = typedRequestData.message.from;
    let dataToSign;
    if (jsonStringifyRequest) {
        dataToSign = JSON.stringify(typedRequestData);
    }
    else {
        dataToSign = typedRequestData;
    }
    return await new Promise((resolve, reject) => {
        let method;
        // @ts-ignore (the entire web3 typing is fucked up)
        if (typeof web3.currentProvider.sendAsync === 'function') {
            // @ts-ignore
            method = web3.currentProvider.sendAsync;
        }
        else {
            // @ts-ignore
            method = web3.currentProvider.send;
        }
        method.bind(web3.currentProvider)({
            method: 'eth_signTypedData' + methodSuffix,
            params: [senderAddress, dataToSign],
            from: senderAddress,
            id: Date.now()
        }, (error, result) => {
            var _a;
            if ((result === null || result === void 0 ? void 0 : result.error) != null) {
                error = result.error;
            }
            if (error != null || result == null) {
                reject((_a = error.message) !== null && _a !== void 0 ? _a : error);
            }
            else {
                resolve(result.result);
            }
        });
    });
}
exports.getEip712Signature = getEip712Signature;
/**
 * @returns maximum possible gas consumption by this relayed call
 */
function calculateTransactionMaxPossibleGas({ gasLimits, hubOverhead, relayCallGasLimit }) {
    return hubOverhead +
        parseInt(relayCallGasLimit) +
        parseInt(gasLimits.preRelayedCallGasLimit) +
        parseInt(gasLimits.postRelayedCallGasLimit);
}
exports.calculateTransactionMaxPossibleGas = calculateTransactionMaxPossibleGas;
function getEcRecoverMeta(message, signature) {
    if (typeof signature === 'string') {
        const r = parseHexString(signature.substr(2, 65));
        const s = parseHexString(signature.substr(66, 65));
        const v = parseHexString(signature.substr(130, 2));
        signature = {
            v: v,
            r: r,
            s: s
        };
    }
    const msg = Buffer.concat([Buffer.from('\x19Ethereum Signed Message:\n32'), Buffer.from(removeHexPrefix(message), 'hex')]);
    const signed = web3_utils_1.default.sha3('0x' + msg.toString('hex'));
    if (signed == null) {
        throw new Error('web3Utils.sha3 failed somehow');
    }
    const bufSigned = Buffer.from(removeHexPrefix(signed), 'hex');
    const recoveredPubKey = ethereumjs_util_1.ecrecover(bufSigned, signature.v[0], Buffer.from(signature.r), Buffer.from(signature.s));
    return ethereumjs_util_1.bufferToHex(ethereumjs_util_1.pubToAddress(recoveredPubKey));
}
exports.getEcRecoverMeta = getEcRecoverMeta;
function parseHexString(str) {
    const result = [];
    while (str.length >= 2) {
        result.push(parseInt(str.substring(0, 2), 16));
        str = str.substring(2, str.length);
    }
    return result;
}
exports.parseHexString = parseHexString;
function isSameAddress(address1, address2) {
    return address1.toLowerCase() === address2.toLowerCase();
}
exports.isSameAddress = isSameAddress;
async function sleep(ms) {
    return await new Promise(resolve => setTimeout(resolve, ms));
}
exports.sleep = sleep;
function ether(n) {
    return new bn_js_1.default(web3_utils_1.toWei(n, 'ether'));
}
exports.ether = ether;
function randomInRange(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
}
exports.randomInRange = randomInRange;
function isSecondEventLater(a, b) {
    if (a.blockNumber === b.blockNumber) {
        return b.transactionIndex > a.transactionIndex;
    }
    return b.blockNumber > a.blockNumber;
}
exports.isSecondEventLater = isSecondEventLater;
function getLatestEventData(events) {
    if (events.length === 0) {
        return;
    }
    const eventDataSorted = events.sort((a, b) => {
        if (a.blockNumber === b.blockNumber) {
            return b.transactionIndex - a.transactionIndex;
        }
        return b.blockNumber - a.blockNumber;
    });
    return eventDataSorted[0];
}
exports.getLatestEventData = getLatestEventData;
function isRegistrationValid(registerEvent, config, managerAddress) {
    return registerEvent != null &&
        isSameAddress(registerEvent.returnValues.relayManager, managerAddress) &&
        registerEvent.returnValues.baseRelayFee.toString() === config.baseRelayFee.toString() &&
        registerEvent.returnValues.pctRelayFee.toString() === config.pctRelayFee.toString() &&
        registerEvent.returnValues.relayUrl.toString() === config.url.toString();
}
exports.isRegistrationValid = isRegistrationValid;
function boolString(bool) {
    return bool ? chalk_1.default.green('good'.padEnd(14)) : chalk_1.default.red('wrong'.padEnd(14));
}
exports.boolString = boolString;
function getDataAndSignature(tx, chainId) {
    const input = [tx.nonce, tx.gasPrice, tx.gasLimit, tx.to, tx.value, tx.data];
    input.push(ethereumjs_util_1.toBuffer(chainId), ethereumjs_util_1.stripZeros(ethereumjs_util_1.toBuffer(0)), ethereumjs_util_1.stripZeros(ethereumjs_util_1.toBuffer(0)));
    let vInt = ethereumjs_util_1.bufferToInt(tx.v);
    if (vInt > 28) {
        vInt -= chainId * 2 + 8;
    }
    const data = `0x${rlp_1.encode(input).toString('hex')}`;
    const r = tx.r.toString('hex').padStart(64, '0');
    const s = tx.s.toString('hex').padStart(64, '0');
    const v = vInt.toString(16).padStart(2, '0');
    const signature = `0x${r}${s}${v}`;
    return {
        data,
        signature
    };
}
exports.getDataAndSignature = getDataAndSignature;
function signedTransactionToHash(signedTransaction, transactionOptions) {
    return ethereumjs_util_1.bufferToHex(new ethereumjs_tx_1.Transaction(signedTransaction, transactionOptions).hash());
}
exports.signedTransactionToHash = signedTransactionToHash;
//# sourceMappingURL=Utils.js.map