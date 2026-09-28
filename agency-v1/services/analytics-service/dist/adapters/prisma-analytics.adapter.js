"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaAnalyticsAdapter = void 0;
class PrismaAnalyticsAdapter {
    mem = new Map();
    async save(s) { this.mem.set(s.companyId, s); return s; }
    async findLatest(cId) { return this.mem.get(cId) || null; }
}
exports.PrismaAnalyticsAdapter = PrismaAnalyticsAdapter;
//# sourceMappingURL=prisma-analytics.adapter.js.map