"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequiredFields = exports.sanitizeString = exports.isValidEmail = void 0;
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};
exports.isValidEmail = isValidEmail;
const sanitizeString = (str) => {
    return str.replace(/[<>]/g, '').trim();
};
exports.sanitizeString = sanitizeString;
const validateRequiredFields = (data, fields) => {
    const missingFields = [];
    for (const field of fields) {
        if (!data[field]) {
            missingFields.push(field);
        }
    }
    return missingFields;
};
exports.validateRequiredFields = validateRequiredFields;
//# sourceMappingURL=validation.utils.js.map