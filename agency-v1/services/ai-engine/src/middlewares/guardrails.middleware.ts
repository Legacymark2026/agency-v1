import { Request, Response, NextFunction } from "express";
import { GuardrailsService } from "../services/guardrails.service";

export const guardrailsMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  if (req.body && req.body.userMessage) {
    const check = GuardrailsService.inspect(req.body.userMessage);
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
