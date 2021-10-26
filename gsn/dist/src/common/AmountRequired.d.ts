/// <reference types="bn.js" />
/// <reference types="@openeth/truffle-typings" />
import { LoggerInterface } from './LoggerInterface';
export declare class AmountRequired {
    logger: LoggerInterface;
    _name: string;
    _currentValue: import("bn.js");
    _requiredValue: import("bn.js");
    _listener?: () => void;
    constructor(name: string, requiredValue: BN, logger: LoggerInterface, listener?: () => void);
    get currentValue(): BN;
    set currentValue(newValue: BN);
    get requiredValue(): BN;
    set requiredValue(newValue: BN);
    _onChange(wasSatisfied: boolean): void;
    get isSatisfied(): boolean;
    get description(): string;
}
