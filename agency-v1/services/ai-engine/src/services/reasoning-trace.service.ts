import Redis from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "redis://redis:6379";

let redis: Redis | null = null;
try {
  redis = new Redis(REDIS_URL, { maxRetriesPerRequest: 2, enableOfflineQueue: false });
} catch {}

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface TraceStep {
  step: number;
  phase: string;               // e.g. "GUARDRAILS_INPUT", "REFRAG", "TOOL_CALL", "HITL_EVAL", "RESPONSE"
  label: string;               // human-readable label
  status: "OK" | "WARN" | "BLOCKED";
  durationMs: number;
  detail?: Record<string, any>;
}

export interface ReasoningTrace {
  traceId: string;
  agentId: string;
  companyId: string;
  conversationId: string;
  userMessage: string;
  finalResponse?: string;
  autonomyMode: string;
  temperature: number;
  confidenceScore: number;
  totalDurationMs: number;
  totalTokensUsed: number;
  hitlRequired: boolean;
  hitlReason?: string;
  toolsExecuted: string[];
  refragChunksUsed: number;
  refragTopScore: number;
  steps: TraceStep[];
  createdAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// ReasoningTraceService
// ─────────────────────────────────────────────────────────────────────────────

export class ReasoningTraceService {
  private static makeTraceId(): string {
    return `trace-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  }

  /** Create a new in-memory trace builder */
  static createBuilder(agentId: string, companyId: string, conversationId: string, userMessage: string): TraceBuilder {
    return new TraceBuilder(agentId, companyId, conversationId, userMessage);
  }

  /** Persist a completed trace to Redis (TTL = 24h) */
  static async saveTrace(trace: ReasoningTrace): Promise<void> {
    if (!redis || redis.status !== "ready") return;
    try {
      const key = `trace:${trace.companyId}:${trace.traceId}`;
      await redis.setex(key, 86400, JSON.stringify(trace));

      // Maintain a sorted set index per company (score = timestamp)
      await redis.zadd(`traces_index:${trace.companyId}`, Date.now(), trace.traceId);
      // Keep last 500 traces per company
      await redis.zremrangebyrank(`traces_index:${trace.companyId}`, 0, -501);
    } catch {}
  }

  /** Retrieve paginated traces for a company */
  static async listTraces(companyId: string, limit = 20, offset = 0): Promise<ReasoningTrace[]> {
    if (!redis || redis.status !== "ready") return [];
    try {
      const ids = await redis.zrevrange(`traces_index:${companyId}`, offset, offset + limit - 1);
      const pipeline = redis.pipeline();
      for (const id of ids) {
        pipeline.get(`trace:${companyId}:${id}`);
      }
      const results = await pipeline.exec();
      return (results || [])
        .map(([, val]) => (val ? JSON.parse(val as string) as ReasoningTrace : null))
        .filter(Boolean) as ReasoningTrace[];
    } catch {
      return [];
    }
  }

  /** Get a single trace by ID */
  static async getTrace(companyId: string, traceId: string): Promise<ReasoningTrace | null> {
    if (!redis || redis.status !== "ready") return null;
    try {
      const raw = await redis.get(`trace:${companyId}:${traceId}`);
      return raw ? JSON.parse(raw) as ReasoningTrace : null;
    } catch {
      return null;
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// TraceBuilder — fluent step-by-step trace recorder
// ─────────────────────────────────────────────────────────────────────────────

export class TraceBuilder {
  private startTime = Date.now();
  private stepTime = Date.now();
  private steps: TraceStep[] = [];
  private stepIndex = 0;
  private toolsExecuted: string[] = [];
  private refragChunksUsed = 0;
  private refragTopScore = 0;
  private hitlRequired = false;
  private hitlReason?: string;
  private finalResponse = "";
  private confidenceScore = 0;
  private autonomyMode = "SEMI_AUTONOMOUS";
  private temperature = 0.65;
  private totalTokensUsed = 0;

  private trace: Partial<ReasoningTrace>;

  constructor(
    private agentId: string,
    private companyId: string,
    private conversationId: string,
    private userMessage: string
  ) {
    this.trace = {
      traceId: `trace-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      agentId,
      companyId,
      conversationId,
      userMessage,
      createdAt: new Date().toISOString()
    };
  }

  addStep(phase: string, label: string, status: "OK" | "WARN" | "BLOCKED", detail?: Record<string, any>): this {
    const now = Date.now();
    this.steps.push({
      step: ++this.stepIndex,
      phase,
      label,
      status,
      durationMs: now - this.stepTime,
      detail
    });
    this.stepTime = now;
    return this;
  }

  setGovernance(autonomyMode: string, temperature: number): this {
    this.autonomyMode = autonomyMode;
    this.temperature = temperature;
    return this;
  }

  setRefrag(chunksUsed: number, topScore: number): this {
    this.refragChunksUsed = chunksUsed;
    this.refragTopScore = topScore;
    return this;
  }

  addTool(toolName: string): this {
    this.toolsExecuted.push(toolName);
    return this;
  }

  setHitl(required: boolean, reason?: string): this {
    this.hitlRequired = required;
    this.hitlReason = reason;
    return this;
  }

  setResponse(response: string, confidenceScore: number): this {
    this.finalResponse = response;
    this.confidenceScore = confidenceScore;
    return this;
  }

  setTokens(tokens: number): this {
    this.totalTokensUsed = tokens;
    return this;
  }

  build(): ReasoningTrace {
    return {
      traceId: this.trace.traceId!,
      agentId: this.agentId,
      companyId: this.companyId,
      conversationId: this.conversationId,
      userMessage: this.userMessage,
      finalResponse: this.finalResponse,
      autonomyMode: this.autonomyMode,
      temperature: this.temperature,
      confidenceScore: this.confidenceScore,
      totalDurationMs: Date.now() - this.startTime,
      totalTokensUsed: this.totalTokensUsed,
      hitlRequired: this.hitlRequired,
      hitlReason: this.hitlReason,
      toolsExecuted: this.toolsExecuted,
      refragChunksUsed: this.refragChunksUsed,
      refragTopScore: this.refragTopScore,
      steps: this.steps,
      createdAt: this.trace.createdAt!
    };
  }
}
