"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logWarn = exports.logError = exports.logInfo = void 0;
const logInfo = (msg, meta) => console.log(`[INFO] ${msg}`, meta || '');
exports.logInfo = logInfo;
const logError = (msg, error) => console.error(`[ERROR] ${msg}`, error || '');
exports.logError = logError;
const logWarn = (msg, meta) => console.warn(`[WARN] ${msg}`, meta || '');
exports.logWarn = logWarn;
//# sourceMappingURL=logger.utils.js.map