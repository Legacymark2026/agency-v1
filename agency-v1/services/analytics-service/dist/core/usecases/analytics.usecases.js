"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsUseCases = void 0;
const analytics_domain_1 = require("../domain/analytics.domain");
class AnalyticsUseCases {
    repoPort;
    eventPublisher;
    constructor(repoPort, eventPublisher) {
        this.repoPort = repoPort;
        this.eventPublisher = eventPublisher;
    }
    async recordSnapshot(dto) {
        const snap = new analytics_domain_1.MetricSnapshotDomain(dto.companyId, dto.activeUsers, dto.totalRevenue, dto.latencyMs);
        const saved = await this.repoPort.save(snap);
        await this.eventPublisher.publishEvent("analytics.snapshot.recorded", { companyId: saved.companyId });
        return saved;
    }
    async getOverview(companyId) {
        return this.repoPort.findLatest(companyId);
    }
}
exports.AnalyticsUseCases = AnalyticsUseCases;
//# sourceMappingURL=analytics.usecases.js.map