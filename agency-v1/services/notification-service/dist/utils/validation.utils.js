"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequiredFields = exports.sanitizeString = exports.isValidEmail = void 0;
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
exports.isValidEmail = isValidEmail;
const sanitizeString = (str) => str.replace(/<[^>]*>?/gm, '').trim();
exports.sanitizeString = sanitizeString;
const validateRequiredFields = (data, fields) => fields.filter(field => !data[field]);
exports.validateRequiredFields = validateRequiredFields;
//# sourceMappingURL=validation.utils.js.map