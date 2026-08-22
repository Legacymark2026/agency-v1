"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.guardrailsMiddleware = void 0;
const guardrails_service_1 = require("../services/guardrails.service");
const guardrailsMiddleware = (req, res, next) => {
    if (req.body && req.body.userMessage) {
        const check = guardrails_service_1.GuardrailsService.inspect(req.body.userMessage);
        if (!check.passed) {
            res.status(400).json({
                error: "Violación de Guardrails de Seguridad",
                details: check.violations,
                promptInjectionDetected: check.promptInjectionDetected
            });
            return;
        }
        // Reemplazar con texto sanitizado si se detectó PII
        if (check.piiDetected) {
            req.body.userMessage = check.sanitizedText;
        }
    }
    next();
};
exports.guardrailsMiddleware = guardrailsMiddleware;
//# sourceMappingURL=guardrails.middleware.js.map