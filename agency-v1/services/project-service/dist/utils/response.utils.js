"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatErrorResponse = exports.formatSuccessResponse = void 0;
const formatSuccessResponse = (data, message = 'Success') => ({ success: true, message, data });
exports.formatSuccessResponse = formatSuccessResponse;
const formatErrorResponse = (error, message = 'Error') => ({ success: false, message, error: error?.message || error });
exports.formatErrorResponse = formatErrorResponse;
//# sourceMappingURL=response.utils.js.map