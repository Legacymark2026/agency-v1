import { IAnalyticsRepositoryPort } from "../core/ports/analytics.ports";
import { MetricSnapshotDomain } from "../core/domain/analytics.domain";

export class PrismaAnalyticsAdapter implements IAnalyticsRepositoryPort {
  private mem = new Map<string, MetricSnapshotDomain>();
  public async save(s: MetricSnapshotDomain) { this.mem.set(s.companyId, s); return s; }
  public async findLatest(cId: string) { return this.mem.get(cId) || null; }
}
