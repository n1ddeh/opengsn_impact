import { PrefixedHexString } from 'ethereumjs-tx';
export interface AuditRequest {
    signedTx: PrefixedHexString;
}
export interface AuditResponse {
    penalizeTxHash?: PrefixedHexString;
    message?: string;
}
export declare const AuditRequestShape: {
    signedTx: import("ow/dist/source").StringPredicate;
};
