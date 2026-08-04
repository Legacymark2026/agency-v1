import Redis from "ioredis";
import { prisma } from "@agency/database";

const REDIS_URL = process.env.REDIS_URL || "redis://redis:6379";

let redis: Redis | null = null;
try {
  redis = new Redis(REDIS_URL, { maxRetriesPerRequest: 2, enableOfflineQueue: false });
} catch {}

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type FeedbackRating = "THUMBS_UP" | "THUMBS_DOWN";

export interface AgentFeedback {
  id: string;
  agentId: string;
  companyId: string;
  conversationId: string;
  traceId?: string;
  rating: FeedbackRating;
  stars?: number;           // 1-5, optional
  comment?: string;
  givenBy?: string;         // userId or 'end_user'
  createdAt: string;
}

export interface FeedbackStats {
  agentId: string;
  companyId: string;
  totalFeedback: number;
  thumbsUp: number;
  thumbsDown: number;
  satisfactionRate: number; // 0-100%
  avgStars: number;
  recentFeedback: AgentFeedback[];
}

// ─────────────────────────────────────────────────────────────────────────────
// FeedbackService
// ─────────────────────────────────────────────────────────────────────────────

export class FeedbackService {
  /**
   * Record feedback (👍 / 👎 + optional stars + comment) for a conversation
   */
  static async recordFeedback(input: Omit<AgentFeedback, "id" | "createdAt">): Promise<AgentFeedback> {
    const feedback: AgentFeedback = {
      id: `fb-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      ...input,
      createdAt: new Date().toISOString()
    };

    // Persist to PostgreSQL
    try {
      await (prisma as any).agentFeedback.create({
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
    } catch {
      // Fallback: store in Redis for 7 days if DB not available
      if (redis && redis.status === "ready") {
        try {
          const key = `feedback:${feedback.companyId}:${feedback.agentId}`;
          await redis.lpush(key, JSON.stringify(feedback));
          await redis.expire(key, 604800);
        } catch {}
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
      } catch {}
    }

    return feedback;
  }

  /**
   * Get aggregate stats for an agent
   */
  static async getStats(companyId: string, agentId: string): Promise<FeedbackStats> {
    const defaultStats: FeedbackStats = {
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
      } catch {}
    }

    // Fallback to DB
    try {
      const rows = await (prisma as any).agentFeedback.findMany({
        where: { companyId, agentId },
        orderBy: { createdAt: "desc" },
        take: 100
      });

      const up = rows.filter((r: any) => r.rating === "THUMBS_UP").length;
      const down = rows.filter((r: any) => r.rating === "THUMBS_DOWN").length;
      const starsRows = rows.filter((r: any) => r.stars != null);
      const avgStars = starsRows.length > 0
        ? Math.round((starsRows.reduce((acc: number, r: any) => acc + r.stars, 0) / starsRows.length) * 10) / 10
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
    } catch {
      return defaultStats;
    }
  }

  /**
   * Get recent feedback items for a company (admin view)
   */
  static async listRecentFeedback(companyId: string, limit = 20): Promise<AgentFeedback[]> {
    try {
      return await (prisma as any).agentFeedback.findMany({
        where: { companyId },
        orderBy: { createdAt: "desc" },
        take: limit
      });
    } catch {
      return [];
    }
  }
}
