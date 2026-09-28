/**
 * Analytics Service — Pure Domain Entities & Metrics
 */
export declare class MetricSnapshotDomain {
    readonly companyId: string;
    readonly activeUsers: number;
    readonly totalRevenue: number;
    readonly responseLatencyMs: number;
    readonly timestamp: Date;
    constructor(companyId: string, activeUsers: number, totalRevenue: number, responseLatencyMs: number, timestamp?: Date);
    isPerformanceOptimal(maxAllowedLatencyMs?: number): boolean;
}
