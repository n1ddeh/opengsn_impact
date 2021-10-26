import { Logger } from 'winston';
import { NpmLogLevel } from '../common/types/Aliases';
export declare function createServerLogger(level: NpmLogLevel, loggerUrl: string, userId: string): Logger;
