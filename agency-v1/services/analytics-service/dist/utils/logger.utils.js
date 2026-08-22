"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logWarn = exports.logError = exports.logInfo = void 0;
const logInfo = (message, meta) => {
    console.log(JSON.stringify({ level: 'info', message, timestamp: new Date().toISOString(), ...meta }));
};
exports.logInfo = logInfo;
const logError = (message, error) => {
    console.error(JSON.stringify({ level: 'error', message, timestamp: new Date().toISOString(), error }));
};
exports.logError = logError;
const logWarn = (message, meta) => {
    console.warn(JSON.stringify({ level: 'warn', message, timestamp: new Date().toISOString(), ...meta }));
};
exports.logWarn = logWarn;
//# sourceMappingURL=logger.utils.js.map