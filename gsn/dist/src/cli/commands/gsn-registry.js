"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const CommandsLogic_1 = __importDefault(require("../CommandsLogic"));
const date_format_1 = __importDefault(require("date-format"));
const utils_1 = require("../utils");
const VersionRegistry_1 = require("../../common/VersionRegistry");
const web3_utils_1 = require("web3-utils");
const CommandsWinstonLogger_1 = require("../CommandsWinstonLogger");
function error(s) {
    console.error(s);
    process.exit(1);
}
function parseTime(t) {
    const m = t.match(/^\s*([\d.]+)\s*([smhdw]?)/i);
    if (m == null)
        error('invalid --delay parameter: must be number with sec/min/hour/day suffix');
    const n = parseFloat(m[1]);
    switch (m[2].toLowerCase()) {
        case 'm':
            return n * 60;
        case 'h':
            return n * 3600;
        case 'd':
            return n * 3600 * 24;
        case 'w':
            return n * 3600 * 24 * 7;
        default: // either 'sec' or nothing
            return n;
    }
}
const commander = utils_1.gsnCommander(['n', 'f', 'm', 'g'])
    .option('--registry <address>', 'versionRegistry')
    .option('-i, --id <string>', 'id to edit/change')
    .option('--list', 'list all registered ids')
    .option('-d, --delay <string>', 'view latest version that is at least that old (sec/min/hour/day)', '0')
    .option('-h, --history', 'show all version history')
    .option('-V, --ver <string>', 'new version to add/cancel')
    .option('-d, --date', 'show date info of versions')
    .option('-a, --add <string>', 'add this version value. if not set, show current value')
    .option('-C, --cancel', 'cancel the given version')
    .option('-r, --reason <string>', 'cancel reason')
    .parse(process.argv);
function formatVersion(id, versionInfo, showDate = false) {
    const dateInfo = showDate ? `[${date_format_1.default('yyyy-MM-dd hh:mm', new Date(versionInfo.time * 1000))}] ` : '';
    return `${id} @ ${versionInfo.version} = ${dateInfo} ${versionInfo.value} ${versionInfo.canceled ? `- CANCELED ${versionInfo.cancelReason}` : ''}`.trim();
}
(async () => {
    var _a, _b, _c, _d;
    const nodeURL = utils_1.getNetworkUrl(commander.network);
    const logger = CommandsWinstonLogger_1.createCommandsLogger(commander.loglevel);
    const mnemonic = utils_1.getMnemonic(commander.mnemonic);
    const logic = new CommandsLogic_1.default(nodeURL, logger, {}, mnemonic);
    const provider = logic.web3.currentProvider;
    const versionRegistryAddress = (_a = utils_1.getRegistryAddress(commander.registry)) !== null && _a !== void 0 ? _a : error('must specify --registry');
    console.log('Using registry at address: ', versionRegistryAddress);
    const versionRegistry = new VersionRegistry_1.VersionRegistry(provider, versionRegistryAddress);
    if (!await versionRegistry.isValid()) {
        error(`Not a valid registry address: ${versionRegistryAddress}`);
    }
    if (commander.args.length > 0) {
        error('unexpected param(s): ' + commander.args.join(', '));
    }
    if (commander.list != null) {
        const ids = await versionRegistry.listIds();
        console.log('All registered IDs:');
        ids.forEach(id => console.log('-', id));
        return;
    }
    const id = (_b = commander.id) !== null && _b !== void 0 ? _b : error('must specify --id');
    const add = commander.add;
    const cancel = commander.cancel;
    const version = commander.ver;
    if (add == null && cancel == null) {
        // view mode
        if (version != null) {
            error('cannot specify --ver without --add or --cancel');
        }
        const showDate = commander.date;
        if (commander.history != null) {
            if (commander.delay !== '0')
                error('cannot specify --delay and --history');
            console.log((await versionRegistry.getAllVersions(id)).map(v => formatVersion(id, v, showDate)));
        }
        else {
            const delayPeriod = parseTime(commander.delay);
            console.log(formatVersion(id, await versionRegistry.getVersion(id, delayPeriod), showDate));
        }
    }
    else {
        if ((add == null) === (cancel == null))
            error('must specify --add or --cancel, but not both');
        const from = (_c = commander.from) !== null && _c !== void 0 ? _c : await logic.findWealthyAccount();
        const sendOptions = {
            gasPrice: web3_utils_1.toWei(commander.gasPrice, 'gwei'),
            gas: 1e6,
            from
        };
        if (version == null) {
            error('--add/--cancel commands require both --id and --ver');
        }
        if (add != null) {
            await versionRegistry.addVersion(id, version, add, sendOptions);
            console.log(`== Added version ${id} @ ${version}`);
        }
        else {
            const reason = (_d = commander.reason) !== null && _d !== void 0 ? _d : '';
            await versionRegistry.cancelVersion(id, version, reason, sendOptions);
            console.log(`== Canceled version ${id} @ ${version}`);
        }
    }
})()
    .then(() => process.exit(0))
    .catch(reason => {
    console.error(reason);
    process.exit(1);
});
//# sourceMappingURL=gsn-registry.js.map