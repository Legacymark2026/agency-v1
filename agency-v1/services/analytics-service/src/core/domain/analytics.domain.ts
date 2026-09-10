/**
 * Analytics Service — Pure Domain Entities & Metrics
 */
export class MetricSnapshotDomain {
  constructor(
    public readonly companyId: string,
    public readonly activeUsers: number,
    public readonly totalRevenue: number,
    public readonly responseLatencyMs: number,
    public readonly timestamp: Date = new Date()
  ) {}

  public isPerformanceOptimal(maxAllowedLatencyMs = 200): boolean {
    return this.responseLatencyMs <= maxAllowedLatencyMs;
  }
}
