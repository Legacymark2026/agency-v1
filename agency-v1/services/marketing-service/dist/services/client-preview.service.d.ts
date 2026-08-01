export interface ClientCompatibilityReport {
    client: string;
    supportLevel: "EXCELLENT" | "GOOD" | "WARNING";
    score: number;
    warnings: string[];
}
export declare class ClientPreviewService {
    /**
     * Analizar marcado HTML y generar reporte de compatibilidad por cliente de correo
     */
    static analyzeCompatibility(html: string): ClientCompatibilityReport[];
}
