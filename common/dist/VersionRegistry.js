"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ethereumjs_util_1 = require("ethereumjs-util");
function string32(s) {
    return ethereumjs_util_1.bufferToHex(Buffer.from(s)).padEnd(66, '0');
}
exports.string32 = string32;
// convert a bytes32 into a string, removing any trailing zeros
function bytes32toString(s) {
    return Buffer.from(s.replace(/^(?:0x)?(.*?)(00)*$/, '$1'), 'hex').toString();
}
exports.bytes32toString = bytes32toString;
class VersionRegistry {
    constructor(fromBlock, contractInteractor) {
        this.fromBlock = fromBlock;
        this.contractInteractor = contractInteractor;
    }
    async isValid() {
        // validate the contract exists, and has the registry API
        const versionRegistryAddress = this.contractInteractor.getDeployment().versionRegistryAddress;
        if (versionRegistryAddress == null) {
            throw new Error('Version Registry address is not provided.');
        }
        if (await this.contractInteractor.getCode(versionRegistryAddress) === '0x') {
            return false;
        }
        // this check return 'true' only for owner
        // return this.registryContract.methods.addVersion('0x414243', '0x313233', '0x313233').estimateGas(this.sendOptions)
        //   .then(() => true)
        //   .catch(() => false)
        return true;
    }
    /**
     * return the latest "mature" version from the registry
     *
     * @dev: current time is last block's timestamp. This resolves any client time-zone discrepancies,
     *  but on local ganache, note that the time doesn't advance unless you mine transactions.
     *
     * @param id object id to return a version for
     * @param delayPeriod - don't return entries younger than that (in seconds)
     * @param optInVersion - if set, return this version even if it is young
     * @return version info that include actual version used, its timestamp and value.
     */
    async getVersion(id, delayPeriod, optInVersion = '') {
        const [versions, now] = await Promise.all([
            this.getAllVersions(id),
            this.contractInteractor.getBlock('latest').then(b => b.timestamp)
        ]);
        const ver = versions
            .find(v => !v.canceled && (v.time + delayPeriod <= now || v.version === optInVersion));
        if (ver == null) {
            throw new Error(`getVersion(${id}) - no version found`);
        }
        return ver;
    }
    /**
     * return all version history of the given id
     * @param id object id to return version history for
     */
    async getAllVersions(id) {
        const events = await this.contractInteractor.getPastEventsForVersionRegistry(['VersionAdded', 'VersionCanceled'], [string32(id)], { fromBlock: this.fromBlock });
        // map of ver=>reason, for every canceled version
        const cancelReasons = events.filter(e => e.event === 'VersionCanceled').reduce((set, e) => (Object.assign(Object.assign({}, set), { [e.returnValues.version]: e.returnValues.reason })), {});
        const found = new Set();
        return events
            .filter(e => e.event === 'VersionAdded')
            .map(e => ({
            version: bytes32toString(e.returnValues.version),
            canceled: cancelReasons[e.returnValues.version] != null,
            cancelReason: cancelReasons[e.returnValues.version],
            value: e.returnValues.value,
            time: parseInt(e.returnValues.time)
        }))
            .filter(e => {
            // use only the first occurrence of each version
            if (found.has(e.version)) {
                return false;
            }
            else {
                found.add(e.version);
                return true;
            }
        })
            .reverse();
    }
    // return all IDs registered
    async listIds() {
        const events = await this.contractInteractor.getPastEventsForVersionRegistry(['VersionAdded'], [], { fromBlock: this.fromBlock });
        const ids = new Set(events.map(e => bytes32toString(e.returnValues.id)));
        return Array.from(ids);
    }
    async addVersion(id, version, value, transactionDetails) {
        await this.checkVersion(id, version, false);
        await this.contractInteractor.addVersionInVersionRegistry(string32(id), string32(version), value, transactionDetails);
    }
    async cancelVersion(id, version, cancelReason, transactionDetails) {
        await this.checkVersion(id, version, true);
        await this.contractInteractor.cancelVersionInVersionRegistry(string32(id), string32(version), cancelReason, transactionDetails);
    }
    async checkVersion(id, version, validateExists) {
        const versions = await this.getAllVersions(id).catch(() => []);
        if ((versions.find(v => v.version === version) != null) !== validateExists) {
            throw new Error(`version ${validateExists ? 'does not exist' : 'already exists'}: ${id} @ ${version}`);
        }
    }
}
exports.VersionRegistry = VersionRegistry;
//# sourceMappingURL=VersionRegistry.js.map