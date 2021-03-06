import { AxiosRequestConfig } from 'axios';
export declare class HttpWrapper {
    private readonly provider;
    private readonly logreq;
    constructor(opts?: AxiosRequestConfig, logreq?: boolean);
    sendPromise(url: string, jsonRequestData?: any): Promise<any>;
}
