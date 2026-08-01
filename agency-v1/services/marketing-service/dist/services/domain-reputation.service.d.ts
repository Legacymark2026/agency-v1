export declare class DomainReputationService {
    /**
     * Verificar dominio contra blacklists DNS conocidas
     */
    static checkBlacklists(domain: string): Promise<{
        blacklist: string;
        listed: boolean;
    }[]>;
    /**
     * Verificar registros DMARC, DKIM y SPF
     */
    static checkDmarcDkimSpf(domain: string): Promise<{
        dmarcValid: boolean;
        spfValid: boolean;
        dkimValid: boolean;
    }>;
    /**
     * Calcular puntuación de remitente 0-100
     */
    static getSenderScore(companyId: string): Promise<number>;
    /**
     * Generar horario de calentamiento de dominio
     */
    static getDomainWarmupSchedule(domain: string, dailyTarget: number): any[];
    /**
     * Combinar todas las verificaciones en un reporte completo
     */
    static getFullReputationReport(domain: string, companyId: string): Promise<{
        domain: string;
        companyId: string;
        score: number;
        auth: {
            dmarcValid: boolean;
            spfValid: boolean;
            dkimValid: boolean;
        };
        blacklists: {
            blacklist: string;
            listed: boolean;
        }[];
        timestamp: string;
    }>;
}
