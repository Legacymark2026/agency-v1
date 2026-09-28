/**
 * Enterprise SLA Uptime & Compliance Tracker
 * ─────────────────────────────────────────────────────────────────────────────
 * Calculates 99.99% Uptime SLA metrics, MTTR, MTBF, and generates customer-facing
 * SLA Compliance Certificates.
 */
export interface SLAMetricsResult {
    companyId: string;
    uptimePercentage: number;
    mttrMinutes: number;
    mtbfDays: number;
    slaStatus: "SLA_MET" | "SLA_BREACHED";
    certificateId: string;
    generatedAt: string;
}
export declare function generateSLAReport(companyId: string): SLAMetricsResult;
