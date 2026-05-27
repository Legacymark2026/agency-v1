"use strict";
/**
 * Templates helper (P1 #6)
 *
 * Support for rendering Handlebars templates
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderTemplate = renderTemplate;
exports.validateTemplateSync = validateTemplateSync;
exports.registerTemplateHelpers = registerTemplateHelpers;
exports.buildMacroTemplateContext = buildMacroTemplateContext;
const handlebars_1 = __importDefault(require("handlebars"));
const logger_1 = require("./logger");
/**
 * Compila y renderiza template con contexto
 */
function renderTemplate(template, context) {
    try {
        const compiled = handlebars_1.default.compile(template);
        return compiled(context);
    }
    catch (error) {
        logger_1.logger.error("[Templates] Error rendering template", {
            error: error instanceof Error ? error.message : String(error),
            templatePreview: template.substring(0, 100),
        });
        // Fallback: return template as-is if compilation fails
        return template;
    }
}
/**
 * Valida syntax de template antes de guardar
 */
function validateTemplateSync(template) {
    try {
        handlebars_1.default.compile(template);
        return { isValid: true, errors: [] };
    }
    catch (error) {
        return {
            isValid: false,
            errors: [error instanceof Error ? error.message : String(error)],
        };
    }
}
/**
 * Registra helpers customizados
 */
function registerTemplateHelpers() {
    // Formato de moneda
    handlebars_1.default.registerHelper("formatCurrency", (value) => {
        return new Intl.NumberFormat("es-CO", {
            style: "currency",
            currency: "COP",
        }).format(value);
    });
    // Formateo de fecha
    handlebars_1.default.registerHelper("formatDate", (date, format = "short") => {
        try {
            const d = typeof date === "string" ? new Date(date) : date;
            if (format === "short") {
                return d.toLocaleDateString("es-CO");
            }
            return d.toISOString();
        }
        catch {
            return "";
        }
    });
    // Condicional equals
    handlebars_1.default.registerHelper("eq", (a, b) => a === b);
    // Condicional not equals
    handlebars_1.default.registerHelper("ne", (a, b) => a !== b);
    // Operaciones matemáticas
    handlebars_1.default.registerHelper("add", (a, b) => a + b);
    // Truncar strings
    handlebars_1.default.registerHelper("truncate", (str, length = 50) => {
        if (str.length > length) {
            return str.substring(0, length) + "...";
        }
        return str;
    });
    // Capitalize
    handlebars_1.default.registerHelper("capitalize", (str) => {
        if (!str)
            return "";
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    });
}
/**
 * Contexto template pre-definido para inbox macros
 */
function buildMacroTemplateContext(data) {
    registerTemplateHelpers();
    return {
        lead: {
            name: data.lead?.name || "",
            email: data.lead?.email || "",
            phone: data.lead?.phone || "",
            company: data.lead?.company || "",
        },
        deal: {
            id: data.deal?.id || "",
            title: data.deal?.title || "",
            value: data.deal?.amount || 0,
            stage: data.deal?.stage || "",
        },
        conversation: {
            id: data.conversation?.id || "",
            channel: data.conversation?.channel || "",
            status: data.conversation?.status || "",
        },
        user: {
            name: data.user?.name || "",
            email: data.user?.email || "",
            phone: data.user?.phone || "",
        },
        company: {
            name: data.company?.name || "",
            website: data.company?.website || "",
        },
        date: new Date(),
        now: new Date(),
    };
}
//# sourceMappingURL=templates.js.map