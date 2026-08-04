export interface GuardrailCheckResult {
  passed: boolean;
  sanitizedText: string;
  violations: string[];
  piiDetected: boolean;
  promptInjectionDetected: boolean;
}

export class GuardrailsService {
  /**
   * Evalúa la seguridad del mensaje de entrada o la respuesta de salida del agente
   */
  static inspect(text: string): GuardrailCheckResult {
    if (!text) {
      return { passed: true, sanitizedText: "", violations: [], piiDetected: false, promptInjectionDetected: false };
    }

    const violations: string[] = [];
    let sanitizedText = text;

    // 1. Detección y Enmascaramiento de PII (Información Personal Identificable)
    // a. Correos electrónicos
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    let piiDetected = false;

    if (emailRegex.test(sanitizedText)) {
      piiDetected = true;
      // Redactar manteniendo dominio para análisis seguro
      sanitizedText = sanitizedText.replace(emailRegex, (match) => {
        const parts = match.split("@");
        return `${parts[0].substring(0, 2)}***@${parts[1]}`;
      });
    }

    // b. Tarjetas de crédito (16 dígitos)
    const creditCardRegex = /\b(?:\d[ -]*?){13,16}\b/g;
    if (creditCardRegex.test(sanitizedText)) {
      piiDetected = true;
      sanitizedText = sanitizedText.replace(creditCardRegex, "[TARJETA_CREDITO_ENMASCARADA]");
      violations.push("Intento de transmisión de datos bancarios / tarjeta de crédito");
    }

    // c. Documentos de Identificación (DNI / Cédula / SSN)
    const ssnRegex = /\b\d{3}-\d{2}-\d{4}\b/g;
    if (ssnRegex.test(sanitizedText)) {
      piiDetected = true;
      sanitizedText = sanitizedText.replace(ssnRegex, "[DOCUMENTO_ID_ENMASCARADO]");
    }

    // 2. Detección de Inyección de Prompts (Prompt Injection Attacks)
    const injectionPatterns = [
      /ignore (all )?previous instructions/i,
      /you are now (an? )?unrestricted/i,
      /system prompt override/i,
      /revela tus instrucciones/i,
      /muestra tu prompt del sistema/i,
      /bypass safety rules/i,
      /act as DAN/i
    ];

    let promptInjectionDetected = false;
    for (const pattern of injectionPatterns) {
      if (pattern.test(text)) {
        promptInjectionDetected = true;
        violations.push(`Prompt Injection Detectado: Patrón '${pattern.source}'`);
        break;
      }
    }

    // 3. Filtro de Contenido Tóxico / Palabras Prohibidas
    const toxicPatterns = [
      /hackear/i,
      /exploit zero-day/i,
      /bypass autenticación/i,
      /generar malware/i
    ];

    for (const pattern of toxicPatterns) {
      if (pattern.test(text)) {
        violations.push(`Contenido no permitido por políticas de seguridad: Patrón '${pattern.source}'`);
      }
    }

    const passed = violations.length === 0 && !promptInjectionDetected;

    return {
      passed,
      sanitizedText,
      violations,
      piiDetected,
      promptInjectionDetected
    };
  }
}
