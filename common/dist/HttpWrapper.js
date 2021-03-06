"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const LOGMAXLEN = 120;
const DEFAULT_TIMEOUT = 15000;
class HttpWrapper {
    constructor(opts = {}, logreq = false) {
        this.provider = axios_1.default.create(Object.assign({
            timeout: DEFAULT_TIMEOUT,
            headers: { 'Content-Type': 'application/json' }
        }, opts));
        this.logreq = logreq;
        if (this.logreq) {
            this.provider.interceptors.response.use(function (response) {
                console.log('got response:', response.config.url, JSON.stringify(response.data).slice(0, LOGMAXLEN));
                return response;
            }, async function (error) {
                const errData = error.response != null ? error.response.data : { error: error.message };
                const errStr = ((typeof errData === 'string') ? errData : JSON.stringify(errData)).slice(0, LOGMAXLEN);
                const errUrl = error.response != null ? error.response.config.url : error.address;
                console.log('got response:', errUrl, 'err=', errStr);
                return await Promise.reject(error);
            });
        }
    }
    async sendPromise(url, jsonRequestData) {
        if (this.logreq) {
            console.log('sending request:', url, JSON.stringify(jsonRequestData !== null && jsonRequestData !== void 0 ? jsonRequestData : {}).slice(0, LOGMAXLEN));
        }
        const response = await this.provider.request({
            url,
            method: jsonRequestData != null ? 'POST' : 'GET',
            data: jsonRequestData
        });
        return response.data;
    }
}
exports.HttpWrapper = HttpWrapper;
//# sourceMappingURL=HttpWrapper.js.map