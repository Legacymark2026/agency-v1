/**
 * Analytics Service — Pure Use Cases
 */
import { IAnalyticsUseCases, IAnalyticsRepositoryPort, IAnalyticsEventPublisherPort } from "../ports/analytics.ports";
import { MetricSnapshotDomain } from "../domain/analytics.domain";
export declare class AnalyticsUseCases implements IAnalyticsUseCases {
    private readonly repoPort;
    private readonly eventPublisher;
    constructor(repoPort: IAnalyticsRepositoryPort, eventPublisher: IAnalyticsEventPublisherPort);
    recordSnapshot(dto: {
        companyId: string;
        activeUsers: number;
        totalRevenue: number;
        latencyMs: number;
    }): Promise<MetricSnapshotDomain>;
    getOverview(companyId: string): Promise<MetricSnapshotDomain | null>;
}
