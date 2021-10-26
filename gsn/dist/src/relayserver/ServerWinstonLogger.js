"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const winston_1 = __importDefault(require("winston"));
const Version_1 = require("../common/Version");
const service = 'gsn-server';
const format = winston_1.default.format.combine(winston_1.default.format.uncolorize(), winston_1.default.format.timestamp(), winston_1.default.format.simple());
const consoleOptions = {
    format: winston_1.default.format.combine(winston_1.default.format.cli())
};
function createServerLogger(level, loggerUrl, userId) {
    const transports = [
        new winston_1.default.transports.Console(consoleOptions)
        // new winston.transports.File({ format, filename })
    ];
    let isCollectingLogs = false;
    if (loggerUrl.length !== 0 && userId.length !== 0) {
        const url = new URL(loggerUrl);
        const host = url.host;
        const path = url.pathname;
        const ssl = url.protocol === 'https:';
        const headers = { 'content-type': 'text/plain' };
        isCollectingLogs = true;
        const httpTransportOptions = {
            ssl,
            format,
            host,
            path,
            headers
        };
        transports.push(new winston_1.default.transports.Http(httpTransportOptions));
    }
    const logger = winston_1.default.createLogger({
        level,
        defaultMeta: {
            version: Version_1.gsnRuntimeVersion,
            service,
            userId: userId
        },
        transports
    });
    logger.debug(`Created logger for ${userId}; remote logs collecting: ${isCollectingLogs}`);
    return logger;
}
exports.createServerLogger = createServerLogger;
//# sourceMappingURL=ServerWinstonLogger.js.map