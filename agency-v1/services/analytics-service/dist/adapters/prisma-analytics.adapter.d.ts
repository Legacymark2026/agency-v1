import { IAnalyticsRepositoryPort } from "../core/ports/analytics.ports";
import { MetricSnapshotDomain } from "../core/domain/analytics.domain";
export declare class PrismaAnalyticsAdapter implements IAnalyticsRepositoryPort {
    private mem;
    save(s: MetricSnapshotDomain): Promise<MetricSnapshotDomain>;
    findLatest(cId: string): Promise<MetricSnapshotDomain | null>;
}
