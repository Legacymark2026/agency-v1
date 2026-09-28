"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetricSnapshotDomain = void 0;
/**
 * Analytics Service — Pure Domain Entities & Metrics
 */
class MetricSnapshotDomain {
    companyId;
    activeUsers;
    totalRevenue;
    responseLatencyMs;
    timestamp;
    constructor(companyId, activeUsers, totalRevenue, responseLatencyMs, timestamp = new Date()) {
        this.companyId = companyId;
        this.activeUsers = activeUsers;
        this.totalRevenue = totalRevenue;
        this.responseLatencyMs = responseLatencyMs;
        this.timestamp = timestamp;
    }
    isPerformanceOptimal(maxAllowedLatencyMs = 200) {
        return this.responseLatencyMs <= maxAllowedLatencyMs;
    }
}
exports.MetricSnapshotDomain = MetricSnapshotDomain;
//# sourceMappingURL=analytics.domain.js.map