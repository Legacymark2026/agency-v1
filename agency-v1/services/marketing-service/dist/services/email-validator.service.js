"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailValidatorService = void 0;
const dns_1 = __importDefault(require("dns"));
const util_1 = require("util");
const resolveMx = (0, util_1.promisify)(dns_1.default.resolveMx);
class EmailValidatorService {
    static disposableDomains = new Set([
        'guerrillamail.com', 'tempmail.com', 'throwaway.com', 'mailinator.com', 'yopmail.com',
        '10minutemail.com', 'dispostable.com', 'sharklasers.com', 'tempmail.net'
    ]);
    /**
     * Verificar dominio desechable
     */
    static isDisposableDomain(domain) {
        return this.disposableDomains.has(domain.toLowerCase());
    }
    /**
     * Obtener registro MX
     */
    static async getMxRecord(domain) {
        try {
            const records = await resolveMx(domain);
            return records && records.length > 0;
        }
        catch (e) {
            return false;
        }
    }
    /**
     * Validar email (formato, desechable, MX)
     */
    static async validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return { isValid: false, isDisposable: false, hasMx: false, error: 'Invalid format' };
        }
        const domain = email.split('@')[1];
        const isDisposable = this.isDisposableDomain(domain);
        const hasMx = await this.getMxRecord(domain);
        return {
            isValid: !isDisposable && hasMx,
            isDisposable,
            hasMx,
            error: !hasMx ? 'No MX record' : (isDisposable ? 'Disposable domain' : null)
        };
    }
    /**
     * Validar lote
     */
    static async validateBatch(emails) {
        const valid = [];
        const invalid = [];
        const disposable = [];
        for (const email of emails) {
            const res = await this.validateEmail(email);
            if (res.isDisposable) {
                disposable.push(email);
            }
            else if (res.isValid) {
                valid.push(email);
            }
            else {
                invalid.push(email);
            }
        }
        return {
            valid,
            invalid,
            disposable,
            score: this.getListQualityScore({ valid: valid.length, invalid: invalid.length, disposable: disposable.length })
        };
    }
    /**
     * Calcular score de calidad de la lista (0-100)
     */
    static getListQualityScore(results) {
        const total = results.valid + results.invalid + results.disposable;
        if (total === 0)
            return 0;
        const validPercent = (results.valid / total) * 100;
        const penalty = (results.disposable / total) * 50 + (results.invalid / total) * 20;
        return Math.max(0, Math.min(100, validPercent - penalty));
    }
}
exports.EmailValidatorService = EmailValidatorService;
//# sourceMappingURL=email-validator.service.js.map