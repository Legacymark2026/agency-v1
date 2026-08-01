export interface AbTestMetrics {
    variantA: {
        subject: string;
        recipientsCount: number;
        opens: number;
        clicks: number;
        openRate: number;
        clickRate: number;
    };
    variantB: {
        subject: string;
        recipientsCount: number;
        opens: number;
        clicks: number;
        openRate: number;
        clickRate: number;
    };
    winner: "A" | "B" | "TIE";
    winningSubject: string;
}
export declare class AbTestingService {
    /**
     * Dividir una lista de destinatarios para prueba A/B (10% A, 10% B, 80% Pendientes para el ganador)
     */
    static splitRecipientsForAbTest(recipients: any[]): {
        sampleA: any[];
        sampleB: any[];
        remaining: any[];
    };
    /**
     * Evaluar la métrica de apertura o clics y declarar la variante ganadora
     */
    static evaluateAbWinner(blastId: string, metricGoal?: "OPENS" | "CLICKS"): Promise<AbTestMetrics>;
}
