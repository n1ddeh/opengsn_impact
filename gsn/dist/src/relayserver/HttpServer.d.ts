import * as core from 'express-serve-static-core';
import { Express, Request, Response } from 'express';
import { PenalizerService } from './penalizer/PenalizerService';
import { LoggerInterface } from '../common/LoggerInterface';
import { RelayServer } from './RelayServer';
import { AuditRequest, AuditResponse } from '../common/types/AuditRequest';
export declare class HttpServer {
    private readonly port;
    readonly logger: LoggerInterface;
    readonly relayService?: RelayServer | undefined;
    readonly penalizerService?: PenalizerService | undefined;
    app: Express;
    private serverInstance?;
    constructor(port: number, logger: LoggerInterface, relayService?: RelayServer | undefined, penalizerService?: PenalizerService | undefined);
    start(): void;
    stop(): void;
    close(): void;
    pingHandler(req: Request, res: Response): Promise<void>;
    relayHandler(req: Request, res: Response): Promise<void>;
    auditHandler(req: Request<core.ParamsDictionary, AuditResponse, AuditRequest>, res: Response<AuditResponse>): Promise<void>;
}
