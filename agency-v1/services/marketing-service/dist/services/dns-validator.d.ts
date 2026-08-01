export interface DnsCheckResult {
    domain: string;
    valid: boolean;
    score: number;
    spf: {
        present: boolean;
        record?: string;
        valid: boolean;
        message: string;
    };
    dkim: {
        present: boolean;
        record?: string;
        valid: boolean;
        message: string;
    };
    dmarc: {
        present: boolean;
        record?: string;
        policy?: string;
        valid: boolean;
        message: string;
    };
    warnings: string[];
}
export declare class DnsValidatorService {
    /**
     * Diagnosticar registros DNS SPF, DKIM y DMARC de un dominio remitente
     */
    static checkDomain(domain: string): Promise<DnsCheckResult>;
}
