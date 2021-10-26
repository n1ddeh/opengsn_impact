"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const web3_1 = __importDefault(require("web3"));
const web3_utils_1 = require("web3-utils");
function retypeItem(abiOutput, ret) {
    if (abiOutput.type.includes('int')) {
        return web3_utils_1.toBN(ret);
    }
    else {
        return ret;
    }
}
// restore TF type: uint are returned as string in web3, and as BN in TF.
function retype(outputs, ret) {
    if ((outputs === null || outputs === void 0 ? void 0 : outputs.length) === 1) {
        return retypeItem(outputs[0], ret);
    }
    else {
        // seems like structure return values in truffle are left as strings,
        return ret;
    }
}
class Contract {
    constructor(contractName, abi) {
        this.contractName = contractName;
        this.abi = abi;
    }
    createContract(address) {
        return new this.web3.eth.Contract(this.abi, address);
    }
    // return a contract instance at the given address.
    // UNLIKE TF, we don't do any on-chain check if the contract exist.
    // the application is assumed to call some view function (e.g. version) that implicitly verifies a contract
    // is deployed at that address (and has that view function)
    async at(address) {
        const contract = this.createContract(address);
        const obj = {
            address,
            contract,
            async getPastEvents(name, options) {
                // @ts-ignore
                return contract.getPastEvents(name, options).map(e => (Object.assign(Object.assign({}, e), { args: e.returnValues // TODO: web3 uses strings, Truffle uses BN for numbers
                 })));
            }
        };
        this.abi.forEach(m => {
            var _a, _b, _c;
            const methodName = (_a = m.name) !== null && _a !== void 0 ? _a : '';
            const nArgs = (_c = (_b = m.inputs) === null || _b === void 0 ? void 0 : _b.length) !== null && _c !== void 0 ? _c : 0;
            const isViewFunction = m.stateMutability === 'view' || m.stateMutability === 'pure';
            obj[methodName] = async function () {
                let args = Array.from(arguments);
                let options;
                if (args.length === nArgs + 1 && typeof args[args.length - 1] === 'object') {
                    options = args[args.length - 1];
                    args = args.slice(0, args.length - 1);
                }
                const methodCall = contract.methods[methodName].apply(contract.methods, args);
                if (!isViewFunction) {
                    return methodCall.send(options);
                }
                else {
                    return methodCall.call(options)
                        .then((res) => {
                        return retype(m.outputs, res);
                    });
                }
                // console.log('===calling', methodName, args)
                // return await methodCall.call(options)
                //   .catch((e: Error) => {
                //     console.log('===ex1', e)
                //     throw e
                //   })
            };
        });
        return obj;
    }
    setProvider(provider, _) {
        this.web3 = new web3_1.default(provider);
    }
}
exports.Contract = Contract;
function TruffleContract({ contractName, abi }) {
    return new Contract(contractName, abi);
}
exports.TruffleContract = TruffleContract;
//# sourceMappingURL=LightTruffleContract.js.map