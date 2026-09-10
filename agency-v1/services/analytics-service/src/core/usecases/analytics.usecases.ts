/**
 * Analytics Service — Pure Use Cases
 */
import {
  IAnalyticsUseCases,
  IAnalyticsRepositoryPort,
  IAnalyticsEventPublisherPort,
} from "../ports/analytics.ports";
import { MetricSnapshotDomain } from "../domain/analytics.domain";

export class AnalyticsUseCases implements IAnalyticsUseCases {
  constructor(
    private readonly repoPort: IAnalyticsRepositoryPort,
    private readonly eventPublisher: IAnalyticsEventPublisherPort
  ) {}

  public async recordSnapshot(dto: { companyId: string; activeUsers: number; totalRevenue: number; latencyMs: number }): Promise<MetricSnapshotDomain> {
    const snap = new MetricSnapshotDomain(dto.companyId, dto.activeUsers, dto.totalRevenue, dto.latencyMs);
    const saved = await this.repoPort.save(snap);
    await this.eventPublisher.publishEvent("analytics.snapshot.recorded", { companyId: saved.companyId });
    return saved;
  }

  public async getOverview(companyId: string): Promise<MetricSnapshotDomain | null> {
    return this.repoPort.findLatest(companyId);
  }
}
