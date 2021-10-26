"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const ethUtils = __importStar(require("ethereumjs-util"));
var ServerAction;
(function (ServerAction) {
    ServerAction[ServerAction["REGISTER_SERVER"] = 0] = "REGISTER_SERVER";
    ServerAction[ServerAction["ADD_WORKER"] = 1] = "ADD_WORKER";
    ServerAction[ServerAction["RELAY_CALL"] = 2] = "RELAY_CALL";
    ServerAction[ServerAction["VALUE_TRANSFER"] = 3] = "VALUE_TRANSFER";
    ServerAction[ServerAction["DEPOSIT_WITHDRAWAL"] = 4] = "DEPOSIT_WITHDRAWAL";
    ServerAction[ServerAction["PENALIZATION"] = 5] = "PENALIZATION";
})(ServerAction = exports.ServerAction || (exports.ServerAction = {}));
/**
 * Make sure not to pass {@link StoredTransaction} as {@param metadata}, as it will override fields from {@param tx}!
 * @param tx
 * @param metadata
 */
function createStoredTransaction(tx, metadata) {
    const details = {
        to: ethUtils.bufferToHex(tx.to),
        gas: ethUtils.bufferToInt(tx.gasLimit),
        gasPrice: ethUtils.bufferToInt(tx.gasPrice),
        data: ethUtils.bufferToHex(tx.data),
        nonce: ethUtils.bufferToInt(tx.nonce),
        txId: ethUtils.bufferToHex(tx.hash())
    };
    return Object.assign({}, details, metadata);
}
exports.createStoredTransaction = createStoredTransaction;
//# sourceMappingURL=StoredTransaction.js.map