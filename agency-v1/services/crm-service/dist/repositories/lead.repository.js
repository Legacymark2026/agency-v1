"use strict";
/**
 * services/crm-service/src/repositories/lead.repository.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * CRM Lead Repository Implementation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.leadRepository = exports.PrismaLeadRepository = void 0;
const database_1 = require("@agency/database");
const events_1 = require("@agency/events");
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const eventBus = new events_1.EventBus(REDIS_URL, "crm-repository");
class PrismaLeadRepository {
    async findMany(params) {
        try {
            const leads = await database_1.prisma.lead.findMany(params);
            return leads;
        }
        catch (err) {
            console.error(`[PrismaLeadRepository] findMany error: ${err.message}`);
            throw err;
        }
    }
    async count(where) {
        try {
            return await database_1.prisma.lead.count({ where });
        }
        catch (err) {
            console.error(`[PrismaLeadRepository] count error: ${err.message}`);
            throw err;
        }
    }
    async create(data) {
        try {
            const lead = await database_1.prisma.lead.create({ data });
            // Dual-Write/CDC synchronization
            await eventBus.publish("lead.created", {
                companyId: lead.companyId,
                name: lead.name,
                email: lead.email || undefined,
                phone: lead.phone || undefined,
                source: lead.source || undefined,
                status: lead.status || undefined,
            }).catch((e) => console.warn("[LeadRepository] Sync publish error:", e.message));
            return lead;
        }
        catch (err) {
            console.error(`[PrismaLeadRepository] create error: ${err.message}`);
            throw err;
        }
    }
    async update(id, data) {
        try {
            const lead = await database_1.prisma.lead.update({
                where: { id },
                data,
            });
            return lead;
        }
        catch (err) {
            console.error(`[PrismaLeadRepository] update error: ${err.message}`);
            throw err;
        }
    }
    async groupBySource(companyId) {
        try {
            return await database_1.prisma.lead.groupBy({
                by: ["source"],
                where: { companyId },
                _count: { id: true },
                _avg: { score: true },
            });
        }
        catch (err) {
            console.error(`[PrismaLeadRepository] groupBySource error: ${err.message}`);
            throw err;
        }
    }
}
exports.PrismaLeadRepository = PrismaLeadRepository;
exports.leadRepository = new PrismaLeadRepository();
//# sourceMappingURL=lead.repository.js.map