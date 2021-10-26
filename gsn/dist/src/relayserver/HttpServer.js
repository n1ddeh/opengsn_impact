"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const body_parser_1 = __importDefault(require("body-parser"));
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const ow_1 = __importDefault(require("ow"));
const AuditRequest_1 = require("../common/types/AuditRequest");
const RelayTransactionRequest_1 = require("../common/types/RelayTransactionRequest");
class HttpServer {
    constructor(port, logger, relayService, penalizerService) {
        this.port = port;
        this.logger = logger;
        this.relayService = relayService;
        this.penalizerService = penalizerService;
        this.app = express_1.default();
        this.app.use(cors_1.default());
        this.app.use(body_parser_1.default.urlencoded({ extended: false }));
        this.app.use(body_parser_1.default.json());
        if (this.relayService != null) {
            this.app.post('/getaddr', this.pingHandler.bind(this));
            this.app.get('/getaddr', this.pingHandler.bind(this));
            this.app.post('/relay', this.relayHandler.bind(this));
            this.relayService.once('removed', this.stop.bind(this));
            this.relayService.once('unstaked', this.close.bind(this));
            this.relayService.on('error', (e) => { console.error('httpServer:', e); });
        }
        if (this.penalizerService != null) {
            this.app.post('/audit', this.auditHandler.bind(this));
        }
    }
    start() {
        this.serverInstance = this.app.listen(this.port, () => {
            var _a;
            console.log('Listening on port', this.port);
            (_a = this.relayService) === null || _a === void 0 ? void 0 : _a.start();
        });
    }
    stop() {
        var _a;
        (_a = this.serverInstance) === null || _a === void 0 ? void 0 : _a.close();
        console.log('Http server stopped.\nShutting down relay...');
    }
    close() {
        var _a;
        console.log('Stopping relay worker...');
        (_a = this.relayService) === null || _a === void 0 ? void 0 : _a.stop();
    }
    async pingHandler(req, res) {
        if (this.relayService == null) {
            throw new Error('RelayServer not initialized');
        }
        const paymaster = req.query.paymaster;
        if (!(paymaster == null || typeof paymaster === 'string')) {
            throw new Error('Paymaster address is not a valid string');
        }
        try {
            const pingResponse = await this.relayService.pingHandler(paymaster);
            res.send(pingResponse);
            console.log(`address ${pingResponse.relayWorkerAddress} sent. ready: ${pingResponse.ready}`);
        }
        catch (e) {
            const message = e.message;
            res.send({ message });
            this.logger.error(`ping handler rejected: ${message}`);
        }
    }
    async relayHandler(req, res) {
        if (this.relayService == null) {
            throw new Error('RelayServer not initialized');
        }
        try {
            ow_1.default(req.body, ow_1.default.object.exactShape(RelayTransactionRequest_1.RelayTransactionRequestShape));
            const signedTx = await this.relayService.createRelayTransaction(req.body);
            res.send({ signedTx });
        }
        catch (e) {
            const error = e.message;
            res.send({ error });
            this.logger.error(`tx failed: ${error}`);
        }
    }
    async auditHandler(req, res) {
        var _a, _b;
        if (this.penalizerService == null) {
            throw new Error('PenalizerService not initialized');
        }
        try {
            ow_1.default(req.body, ow_1.default.object.exactShape(AuditRequest_1.AuditRequestShape));
            let message = '';
            let penalizeResponse = await this.penalizerService.penalizeRepeatedNonce(req.body);
            message += (_a = penalizeResponse.message) !== null && _a !== void 0 ? _a : '';
            if (penalizeResponse.penalizeTxHash == null) {
                penalizeResponse = await this.penalizerService.penalizeIllegalTransaction(req.body);
                message += (_b = penalizeResponse.message) !== null && _b !== void 0 ? _b : '';
            }
            res.send({
                penalizeTxHash: penalizeResponse.penalizeTxHash,
                message
            });
        }
        catch (e) {
            const message = e.message;
            res.send({ message });
            this.logger.error(`penalization failed: ${message}`);
        }
    }
}
exports.HttpServer = HttpServer;
//# sourceMappingURL=HttpServer.js.map