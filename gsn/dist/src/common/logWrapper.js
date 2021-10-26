"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// wrap given method(s) of an object with before/after lines
// handles sync and async methods
function logWrap(obj, func) {
    if (Array.isArray(func)) {
        func.forEach(f => logWrap(obj, f));
        return;
    }
    const objfunc = obj[func];
    if (typeof objfunc !== 'function') {
        throw new Error(`can't wrap: not a function: ${func}`);
    }
    console.log('logWrapping: ', func);
    obj[func] = function () {
        var _a;
        console.log('>>> calling: ', func);
        try {
            const ret = objfunc.apply(obj, arguments);
            if (((_a = ret === null || ret === void 0 ? void 0 : ret.constructor) === null || _a === void 0 ? void 0 : _a.name) === 'Promise') {
                ret.then((asyncret) => {
                    console.log('<<< async return:', func, asyncret);
                    return Promise.resolve(asyncret);
                }).catch((err) => {
                    console.log('<<< async exception:', func, err);
                    return Promise.reject(err);
                });
            }
            else {
                console.log('<<< return:', func, ret);
                return ret;
            }
        }
        catch (e) {
            console.log('<<< exception:', func, e);
            throw e;
        }
    };
}
exports.logWrap = logWrap;
//# sourceMappingURL=logWrapper.js.map