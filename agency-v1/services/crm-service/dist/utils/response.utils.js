"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatErrorResponse = exports.formatSuccessResponse = void 0;
const formatSuccessResponse = (data, message = 'Success') => ({
    success: true,
    message,
    data
});
exports.formatSuccessResponse = formatSuccessResponse;
const formatErrorResponse = (error, statusCode = 500) => ({
    success: false,
    error,
    statusCode
});
exports.formatErrorResponse = formatErrorResponse;
//# sourceMappingURL=response.utils.js.map