export interface GuardrailCheckResult {
    passed: boolean;
    sanitizedText: string;
    violations: string[];
    piiDetected: boolean;
    promptInjectionDetected: boolean;
}
export declare class GuardrailsService {
    /**
     * Evalúa la seguridad del mensaje de entrada o la respuesta de salida del agente
     */
    static inspect(text: string): GuardrailCheckResult;
}
