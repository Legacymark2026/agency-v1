"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeedbackService = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const database_1 = require("@agency/database");
const REDIS_URL = process.env.REDIS_URL || "redis://redis:6379";
let redis = null;
try {
    redis = new ioredis_1.default(REDIS_URL, { maxRetriesPerRequest: 2, enableOfflineQueue: false });
}
catch { }
// ─────────────────────────────────────────────────────────────────────────────
// FeedbackService
// ─────────────────────────────────────────────────────────────────────────────
class FeedbackService {
    /**
     * Record feedback (👍 / 👎 + optional stars + comment) for a conversation
     */
    static async recordFeedback(input) {
        const feedback = {
            id: `fb-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            ...input,
            createdAt: new Date().toISOString()
        };
        // Persist to PostgreSQL
        try {
            await database_1.prisma.agentFeedback.create({
                data: {
                    id: feedback.id,
                    agentId: feedback.agentId,
                    companyId: feedback.companyId,
                    conversationId: feedback.conversationId,
                    traceId: feedback.traceId,
                    rating: feedback.rating,
                    stars: feedback.stars,
                    comment: feedback.comment,
                    givenBy: feedback.givenBy
                }
            });
        }
        catch {
            // Fallback: store in Redis for 7 days if DB not available
            if (redis && redis.status === "ready") {
                try {
                    const key = `feedback:${feedback.companyId}:${feedback.agentId}`;
                    await redis.lpush(key, JSON.stringify(feedback));
                    await redis.expire(key, 604800);
                }
                catch { }
            }
        }
        // Update running stats in Redis (for fast dashboard reads)
        if (redis && redis.status === "ready") {
            try {
                const statsKey = `feedback_stats:${feedback.companyId}:${feedback.agentId}`;
                const pipeline = redis.pipeline();
                pipeline.hincrby(statsKey, "total", 1);
                pipeline.hincrby(statsKey, feedback.rating === "THUMBS_UP" ? "up" : "down", 1);
                if (feedback.stars) {
                    pipeline.hincrbyfloat(statsKey, "starsSum", feedback.stars);
                    pipeline.hincrby(statsKey, "starsCount", 1);
                }
                pipeline.expire(statsKey, 2592000); // 30 days
                await pipeline.exec();
            }
            catch { }
        }
        return feedback;
    }
    /**
     * Get aggregate stats for an agent
     */
    static async getStats(companyId, agentId) {
        const defaultStats = {
            agentId,
            companyId,
            totalFeedback: 0,
            thumbsUp: 0,
            thumbsDown: 0,
            satisfactionRate: 0,
            avgStars: 0,
            recentFeedback: []
        };
        // Try fast Redis stats
        if (redis && redis.status === "ready") {
            try {
                const statsKey = `feedback_stats:${companyId}:${agentId}`;
                const stats = await redis.hgetall(statsKey);
                if (stats && stats.total) {
                    const total = parseInt(stats.total || "0");
                    const up = parseInt(stats.up || "0");
                    const down = parseInt(stats.down || "0");
                    const starsSum = parseFloat(stats.starsSum || "0");
                    const starsCount = parseInt(stats.starsCount || "0");
                    return {
                        ...defaultStats,
                        totalFeedback: total,
                        thumbsUp: up,
                        thumbsDown: down,
                        satisfactionRate: total > 0 ? Math.round((up / total) * 100) : 0,
                        avgStars: starsCount > 0 ? Math.round((starsSum / starsCount) * 10) / 10 : 0
                    };
                }
            }
            catch { }
        }
        // Fallback to DB
        try {
            const rows = await database_1.prisma.agentFeedback.findMany({
                where: { companyId, agentId },
                orderBy: { createdAt: "desc" },
                take: 100
            });
            const up = rows.filter((r) => r.rating === "THUMBS_UP").length;
            const down = rows.filter((r) => r.rating === "THUMBS_DOWN").length;
            const starsRows = rows.filter((r) => r.stars != null);
            const avgStars = starsRows.length > 0
                ? Math.round((starsRows.reduce((acc, r) => acc + r.stars, 0) / starsRows.length) * 10) / 10
                : 0;
            return {
                agentId,
                companyId,
                totalFeedback: rows.length,
                thumbsUp: up,
                thumbsDown: down,
                satisfactionRate: rows.length > 0 ? Math.round((up / rows.length) * 100) : 0,
                avgStars,
                recentFeedback: rows.slice(0, 10)
            };
        }
        catch {
            return defaultStats;
        }
    }
    /**
     * Get recent feedback items for a company (admin view)
     */
    static async listRecentFeedback(companyId, limit = 20) {
        try {
            return await database_1.prisma.agentFeedback.findMany({
                where: { companyId },
                orderBy: { createdAt: "desc" },
                take: limit
            });
        }
        catch {
            return [];
        }
    }
}
exports.FeedbackService = FeedbackService;
//# sourceMappingURL=feedback.service.js.map