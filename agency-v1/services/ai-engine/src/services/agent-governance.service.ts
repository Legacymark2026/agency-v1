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

export type AutonomyMode = "AUTONOMOUS" | "SEMI_AUTONOMOUS" | "SUPERVISED_ONLY";

export interface AgentGovernanceConfig {
  agentId: string;
  companyId: string;
  autonomyMode: AutonomyMode;
  temperature: number;          // 0.0 → 1.0
  dailyTokenBudget: number;     // Max tokens/day for this agent
  monthlyUsdBudget: number;     // Max USD spend/month
  hitlConfidenceThreshold: number; // 0.0 → 1.0 — below this → HITL
  hitlHighValueQuoteUsd: number;   // Quotes above this USD → HITL
  allowedTools: string[];          // Tool whitelist — empty = all
  systemPromptOverride?: string;   // Optional system prompt override
  isActive: boolean;
  updatedAt: string;
}

const DEFAULT_CONFIG: Omit<AgentGovernanceConfig, "agentId" | "companyId"> = {
  autonomyMode: "SEMI_AUTONOMOUS",
  temperature: 0.65,
  dailyTokenBudget: 50000,
  monthlyUsdBudget: 50,
  hitlConfidenceThreshold: 0.82,
  hitlHighValueQuoteUsd: 3000,
  allowedTools: [],
  isActive: true,
  updatedAt: new Date().toISOString()
};

// ─────────────────────────────────────────────────────────────────────────────
// AgentGovernanceService
// ─────────────────────────────────────────────────────────────────────────────

export class AgentGovernanceService {
  private static cacheKey(companyId: string, agentId: string) {
    return `gov:${companyId}:${agentId}`;
  }

  /**
   * Retrieves the governance configuration for an agent.
   * Priority: Redis cache → PostgreSQL → defaults.
   */
  static async getConfig(companyId: string, agentId: string): Promise<AgentGovernanceConfig> {
    // 1. Try Redis cache (TTL = 5 min)
    if (redis && redis.status === "ready") {
      try {
        const cached = await redis.get(this.cacheKey(companyId, agentId));
        if (cached) return JSON.parse(cached) as AgentGovernanceConfig;
      } catch {}
    }

    // 2. Try PostgreSQL
    let config: AgentGovernanceConfig | null = null;
    try {
      const row = await (prisma as any).agentGovernanceConfig.findUnique({
        where: { agentId_companyId: { agentId, companyId } }
      });
      if (row) {
        config = {
          agentId,
          companyId,
          autonomyMode: row.autonomyMode as AutonomyMode,
          temperature: row.temperature ?? DEFAULT_CONFIG.temperature,
          dailyTokenBudget: row.dailyTokenBudget ?? DEFAULT_CONFIG.dailyTokenBudget,
          monthlyUsdBudget: row.monthlyUsdBudget ?? DEFAULT_CONFIG.monthlyUsdBudget,
          hitlConfidenceThreshold: row.hitlConfidenceThreshold ?? DEFAULT_CONFIG.hitlConfidenceThreshold,
          hitlHighValueQuoteUsd: row.hitlHighValueQuoteUsd ?? DEFAULT_CONFIG.hitlHighValueQuoteUsd,
          allowedTools: row.allowedTools ?? [],
          systemPromptOverride: row.systemPromptOverride ?? undefined,
          isActive: row.isActive ?? true,
          updatedAt: row.updatedAt?.toISOString() ?? new Date().toISOString()
        };
      }
    } catch {}

    // 3. Fallback to defaults
    if (!config) {
      config = { agentId, companyId, ...DEFAULT_CONFIG, updatedAt: new Date().toISOString() };
    }

    // Cache in Redis for 5 minutes
    if (redis && redis.status === "ready") {
      try {
        await redis.setex(this.cacheKey(companyId, agentId), 300, JSON.stringify(config));
      } catch {}
    }

    return config;
  }

  /**
   * Saves or updates the governance configuration for an agent (upsert).
   */
  static async upsertConfig(
    companyId: string,
    agentId: string,
    updates: Partial<Omit<AgentGovernanceConfig, "agentId" | "companyId" | "updatedAt">>
  ): Promise<AgentGovernanceConfig> {
    const now = new Date().toISOString();

    // Build the new config by merging current + updates
    const current = await this.getConfig(companyId, agentId);
    const merged: AgentGovernanceConfig = { ...current, ...updates, agentId, companyId, updatedAt: now };

    // Persist to DB
    try {
      await (prisma as any).agentGovernanceConfig.upsert({
        where: { agentId_companyId: { agentId, companyId } },
        update: {
          autonomyMode: merged.autonomyMode,
          temperature: merged.temperature,
          dailyTokenBudget: merged.dailyTokenBudget,
          monthlyUsdBudget: merged.monthlyUsdBudget,
          hitlConfidenceThreshold: merged.hitlConfidenceThreshold,
          hitlHighValueQuoteUsd: merged.hitlHighValueQuoteUsd,
          allowedTools: merged.allowedTools,
          systemPromptOverride: merged.systemPromptOverride,
          isActive: merged.isActive,
          updatedAt: new Date()
        },
        create: {
          agentId,
          companyId,
          autonomyMode: merged.autonomyMode,
          temperature: merged.temperature,
          dailyTokenBudget: merged.dailyTokenBudget,
          monthlyUsdBudget: merged.monthlyUsdBudget,
          hitlConfidenceThreshold: merged.hitlConfidenceThreshold,
          hitlHighValueQuoteUsd: merged.hitlHighValueQuoteUsd,
          allowedTools: merged.allowedTools,
          systemPromptOverride: merged.systemPromptOverride,
          isActive: merged.isActive
        }
      });
    } catch {
      // If table does not exist yet (migration pending), still return merged in memory
    }

    // Invalidate Redis cache
    if (redis && redis.status === "ready") {
      try { await redis.del(this.cacheKey(companyId, agentId)); } catch {}
    }

    return merged;
  }

  /**
   * Evaluates whether a response MUST go through HITL given the governance config.
   * Returns the final effective HITL decision with reason.
   */
  static evaluateHitl(
    config: AgentGovernanceConfig,
    confidenceScore: number,
    toolExecuted?: string,
    quoteAmount?: number,
    userMessage?: string
  ): { requiresReview: boolean; reason?: string } {
    // Mode: SUPERVISED_ONLY → always HITL
    if (config.autonomyMode === "SUPERVISED_ONLY") {
      return { requiresReview: true, reason: "Modo SUPERVISED_ONLY: toda respuesta requiere aprobación humana" };
    }

    // Mode: AUTONOMOUS → only HITL if critical events
    if (config.autonomyMode === "AUTONOMOUS") {
      if (confidenceScore < 0.70) {
        return { requiresReview: true, reason: `Modo AUTONOMOUS: confianza muy baja (${(confidenceScore * 100).toFixed(1)}%)` };
      }
      return { requiresReview: false };
    }

    // Mode: SEMI_AUTONOMOUS (default) — use configurable thresholds
    if (confidenceScore < config.hitlConfidenceThreshold) {
      return { requiresReview: true, reason: `Confianza ${(confidenceScore * 100).toFixed(1)}% por debajo del umbral configurado (${(config.hitlConfidenceThreshold * 100).toFixed(0)}%)` };
    }

    if (quoteAmount && quoteAmount > config.hitlHighValueQuoteUsd) {
      return { requiresReview: true, reason: `Cotización de alto valor USD $${quoteAmount.toLocaleString()} supera límite configurado de $${config.hitlHighValueQuoteUsd.toLocaleString()}` };
    }

    if (config.autonomyMode === "SEMI_AUTONOMOUS" && toolExecuted === "send_email_campaign") {
      return { requiresReview: true, reason: "SEMI_AUTONOMOUS: envío de campaña masiva requiere aprobación" };
    }

    const msgLower = (userMessage || "").toLowerCase();
    if (msgLower.includes("demanda") || msgLower.includes("abogado") || msgLower.includes("reembolso") || msgLower.includes("cancelar contrato")) {
      return { requiresReview: true, reason: "Consulta de Alto Riesgo / Legal detectada" };
    }

    return { requiresReview: false };
  }

  /**
   * Returns all governance configs for a company (admin panel)
   */
  static async listConfigs(companyId: string): Promise<AgentGovernanceConfig[]> {
    try {
      const rows = await (prisma as any).agentGovernanceConfig.findMany({
        where: { companyId },
        orderBy: { updatedAt: "desc" }
      });
      return rows.map((r: any) => ({
        agentId: r.agentId,
        companyId: r.companyId,
        autonomyMode: r.autonomyMode as AutonomyMode,
        temperature: r.temperature,
        dailyTokenBudget: r.dailyTokenBudget,
        monthlyUsdBudget: r.monthlyUsdBudget,
        hitlConfidenceThreshold: r.hitlConfidenceThreshold,
        hitlHighValueQuoteUsd: r.hitlHighValueQuoteUsd,
        allowedTools: r.allowedTools ?? [],
        systemPromptOverride: r.systemPromptOverride,
        isActive: r.isActive,
        updatedAt: r.updatedAt?.toISOString() ?? new Date().toISOString()
      }));
    } catch {
      return [];
    }
  }
}
