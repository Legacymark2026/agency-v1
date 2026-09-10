/**
 * Analytics Service — Hexagonal Ports
 */
import { MetricSnapshotDomain } from "../domain/analytics.domain";

export interface IAnalyticsUseCases {
  recordSnapshot(dto: { companyId: string; activeUsers: number; totalRevenue: number; latencyMs: number }): Promise<MetricSnapshotDomain>;
  getOverview(companyId: string): Promise<MetricSnapshotDomain | null>;
}

export interface IAnalyticsRepositoryPort {
  save(snapshot: MetricSnapshotDomain): Promise<MetricSnapshotDomain>;
  findLatest(companyId: string): Promise<MetricSnapshotDomain | null>;
}

export interface IAnalyticsEventPublisherPort {
  publishEvent(topic: string, event: Record<string, any>): Promise<void>;
}
