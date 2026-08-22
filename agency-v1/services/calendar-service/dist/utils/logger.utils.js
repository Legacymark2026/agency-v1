"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logWarn = exports.logError = exports.logInfo = void 0;
const logInfo = (message, context) => {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, context || '');
};
exports.logInfo = logInfo;
const logError = (message, error) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error || '');
};
exports.logError = logError;
const logWarn = (message, context) => {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, context || '');
};
exports.logWarn = logWarn;
//# sourceMappingURL=logger.utils.js.map