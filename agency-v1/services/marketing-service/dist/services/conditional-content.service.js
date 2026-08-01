"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConditionalContentService = void 0;
class ConditionalContentService {
    /**
     * Evaluar si un bloque con regla showIf debe ser visible para un usuario
     */
    static shouldShowBlock(rule, recipientContext = {}) {
        if (!rule)
            return true;
        const actualValue = recipientContext[rule.field];
        switch (rule.operator) {
            case "equals":
                return String(actualValue).toLowerCase() === String(rule.value).toLowerCase();
            case "not_equals":
                return String(actualValue).toLowerCase() !== String(rule.value).toLowerCase();
            case "contains":
                return String(actualValue || "").toLowerCase().includes(String(rule.value || "").toLowerCase());
            case "greater_than":
                return Number(actualValue) > Number(rule.value);
            case "less_than":
                return Number(actualValue) < Number(rule.value);
            default:
                return true;
        }
    }
    /**
     * Filtrar bloques de una plantilla basándose en el perfil del destinatario
     */
    static filterBlocksForRecipient(blocks, recipientContext = {}) {
        if (!blocks || !Array.isArray(blocks))
            return [];
        return blocks.filter((b) => this.shouldShowBlock(b.showIf, recipientContext));
    }
}
exports.ConditionalContentService = ConditionalContentService;
//# sourceMappingURL=conditional-content.service.js.map