"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VariableParserService = void 0;
class VariableParserService {
    static DEFAULT_CONTEXT = {
        name: "Cliente VIP",
        email: "cliente@ejemplo.com",
        companyName: "Tu Empresa SAS",
        discountCode: "PROMO2026",
        unsubscribeLink: "https://legacymarksas.com/unsubscribe?demo=1"
    };
    /**
     * Parsear e interpolar variables dinámicas {{variable}} en cadenas de texto o marcado HTML
     */
    static parseVariables(templateText, context = {}) {
        if (!templateText)
            return "";
        const mergedContext = { ...this.DEFAULT_CONTEXT, ...context };
        return templateText.replace(/\{\{\s*([\w\.]+)\s*\}\}/g, (_match, key) => {
            const value = this.getNestedValue(mergedContext, key);
            return value !== undefined && value !== null ? String(value) : `{{${key}}}`;
        });
    }
    static getNestedValue(obj, path) {
        return path.split(".").reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : undefined), obj);
    }
}
exports.VariableParserService = VariableParserService;
//# sourceMappingURL=variable-parser.service.js.map