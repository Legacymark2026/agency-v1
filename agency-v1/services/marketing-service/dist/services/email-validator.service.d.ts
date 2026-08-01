export declare class EmailValidatorService {
    private static disposableDomains;
    /**
     * Verificar dominio desechable
     */
    static isDisposableDomain(domain: string): boolean;
    /**
     * Obtener registro MX
     */
    static getMxRecord(domain: string): Promise<boolean>;
    /**
     * Validar email (formato, desechable, MX)
     */
    static validateEmail(email: string): Promise<{
        isValid: boolean;
        isDisposable: boolean;
        hasMx: boolean;
        error: string | null;
    }>;
    /**
     * Validar lote
     */
    static validateBatch(emails: string[]): Promise<{
        valid: string[];
        invalid: string[];
        disposable: string[];
        score: number;
    }>;
    /**
     * Calcular score de calidad de la lista (0-100)
     */
    static getListQualityScore(results: {
        valid: number;
        invalid: number;
        disposable: number;
    }): number;
}
