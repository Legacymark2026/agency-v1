"use strict";
/**
 * services/crm-service/src/cqrs/commands.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * CQRS — Command Side (Write Operations & Event Sourcing)
 * Executes ACID mutations against PostgreSQL Primary and publishes events.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeCreateLeadCommand = executeCreateLeadCommand;
exports.executeUpdateDealStageCommand = executeUpdateDealStageCommand;
const database_1 = require("@agency/database");
const events_1 = require("@agency/events");
const ioredis_1 = __importDefault(require("ioredis"));
const assignment_engine_1 = require("../assignment-engine");
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const eventBus = new events_1.EventBus(REDIS_URL, "crm-service");
const redisClient = new ioredis_1.default(REDIS_URL);
// Helper to invalidate CQRS Read View cache in Redis
async function invalidateCqrsReadView(companyId, resource) {
    try {
        const keys = await redisClient.keys(`crm:view:${resource}:${companyId}:*`);
        if (keys.length > 0) {
            await redisClient.del(...keys);
        }
    }
    catch (err) {
        console.error("[CQRS:Command] Read view invalidation error:", err.message);
    }
}
async function executeCreateLeadCommand(input) {
    const { companyId, name, email, phone, source, status, score, value, customFields } = input;
    // Perform ACID write transaction on PostgreSQL Primary
    const lead = await database_1.prisma.lead.create({
        data: {
            companyId,
            name,
            email: email || null,
            phone: phone || null,
            source: source || "MANUAL",
            status: status || "NEW",
            score: score ?? 50,
            value: value ?? 0,
            customFields: customFields ? JSON.stringify(customFields) : undefined,
        },
    });
    // Automated Routing / Assignment
    try {
        const assignedUserId = await (0, assignment_engine_1.routeLead)(lead.id);
        if (assignedUserId) {
            await eventBus.publish("lead.assigned", {
                leadId: lead.id,
                leadName: lead.name,
                companyId,
                assignedToUserId: String(assignedUserId),
            });
        }
    }
    catch { }
    // Publish EventBus Event
    await eventBus.publish("lead.created", {
        leadId: lead.id,
        companyId,
        name: lead.name,
        email: lead.email,
        source: lead.source,
        score: lead.score,
    });
    // Invalidate Query Read View Cache in Redis
    await invalidateCqrsReadView(companyId, "leads");
    return lead;
}
async function executeUpdateDealStageCommand(input) {
    const { dealId, companyId, toStage } = input;
    const existingDeal = await database_1.prisma.deal.findUnique({ where: { id: dealId } });
    if (!existingDeal)
        throw new Error("Deal not found");
    const fromStage = existingDeal.stage;
    const updatedDeal = await database_1.prisma.deal.update({
        where: { id: dealId },
        data: {
            stage: toStage,
            ...(toStage === "CLOSED_WON" ? { wonAt: new Date() } : {}),
            ...(toStage === "CLOSED_LOST" ? { lostAt: new Date() } : {}),
        },
    });
    // Publish Stage Changed Event
    await eventBus.publish("deal.stage_changed", {
        dealId,
        companyId,
        title: updatedDeal.title,
        fromStage,
        toStage,
        value: updatedDeal.value,
    });
    if (toStage === "CLOSED_WON") {
        await eventBus.publish("deal.won", {
            dealId,
            companyId,
            title: updatedDeal.title,
            value: updatedDeal.value,
        });
    }
    else if (toStage === "CLOSED_LOST") {
        await eventBus.publish("deal.lost", {
            dealId,
            companyId,
            title: updatedDeal.title,
        });
    }
    // Invalidate Query Read View Cache
    await invalidateCqrsReadView(companyId, "pipeline");
    return updatedDeal;
}
//# sourceMappingURL=commands.js.map