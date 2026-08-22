"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TraceBuilder = exports.ReasoningTraceService = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const REDIS_URL = process.env.REDIS_URL || "redis://redis:6379";
let redis = null;
try {
    redis = new ioredis_1.default(REDIS_URL, { maxRetriesPerRequest: 2, enableOfflineQueue: false });
}
catch { }
// ─────────────────────────────────────────────────────────────────────────────
// ReasoningTraceService
// ─────────────────────────────────────────────────────────────────────────────
class ReasoningTraceService {
    static makeTraceId() {
        return `trace-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    }
    /** Create a new in-memory trace builder */
    static createBuilder(agentId, companyId, conversationId, userMessage) {
        return new TraceBuilder(agentId, companyId, conversationId, userMessage);
    }
    /** Persist a completed trace to Redis (TTL = 24h) */
    static async saveTrace(trace) {
        if (!redis || redis.status !== "ready")
            return;
        try {
            const key = `trace:${trace.companyId}:${trace.traceId}`;
            await redis.setex(key, 86400, JSON.stringify(trace));
            // Maintain a sorted set index per company (score = timestamp)
            await redis.zadd(`traces_index:${trace.companyId}`, Date.now(), trace.traceId);
            // Keep last 500 traces per company
            await redis.zremrangebyrank(`traces_index:${trace.companyId}`, 0, -501);
        }
        catch { }
    }
    /** Retrieve paginated traces for a company */
    static async listTraces(companyId, limit = 20, offset = 0) {
        if (!redis || redis.status !== "ready")
            return [];
        try {
            const ids = await redis.zrevrange(`traces_index:${companyId}`, offset, offset + limit - 1);
            const pipeline = redis.pipeline();
            for (const id of ids) {
                pipeline.get(`trace:${companyId}:${id}`);
            }
            const results = await pipeline.exec();
            return (results || [])
                .map(([, val]) => (val ? JSON.parse(val) : null))
                .filter(Boolean);
        }
        catch {
            return [];
        }
    }
    /** Get a single trace by ID */
    static async getTrace(companyId, traceId) {
        if (!redis || redis.status !== "ready")
            return null;
        try {
            const raw = await redis.get(`trace:${companyId}:${traceId}`);
            return raw ? JSON.parse(raw) : null;
        }
        catch {
            return null;
        }
    }
}
exports.ReasoningTraceService = ReasoningTraceService;
// ─────────────────────────────────────────────────────────────────────────────
// TraceBuilder — fluent step-by-step trace recorder
// ─────────────────────────────────────────────────────────────────────────────
class TraceBuilder {
    agentId;
    companyId;
    conversationId;
    userMessage;
    startTime = Date.now();
    stepTime = Date.now();
    steps = [];
    stepIndex = 0;
    toolsExecuted = [];
    refragChunksUsed = 0;
    refragTopScore = 0;
    hitlRequired = false;
    hitlReason;
    finalResponse = "";
    confidenceScore = 0;
    autonomyMode = "SEMI_AUTONOMOUS";
    temperature = 0.65;
    totalTokensUsed = 0;
    trace;
    constructor(agentId, companyId, conversationId, userMessage) {
        this.agentId = agentId;
        this.companyId = companyId;
        this.conversationId = conversationId;
        this.userMessage = userMessage;
        this.trace = {
            traceId: `trace-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
            agentId,
            companyId,
            conversationId,
            userMessage,
            createdAt: new Date().toISOString()
        };
    }
    addStep(phase, label, status, detail) {
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
    setGovernance(autonomyMode, temperature) {
        this.autonomyMode = autonomyMode;
        this.temperature = temperature;
        return this;
    }
    setRefrag(chunksUsed, topScore) {
        this.refragChunksUsed = chunksUsed;
        this.refragTopScore = topScore;
        return this;
    }
    addTool(toolName) {
        this.toolsExecuted.push(toolName);
        return this;
    }
    setHitl(required, reason) {
        this.hitlRequired = required;
        this.hitlReason = reason;
        return this;
    }
    setResponse(response, confidenceScore) {
        this.finalResponse = response;
        this.confidenceScore = confidenceScore;
        return this;
    }
    setTokens(tokens) {
        this.totalTokensUsed = tokens;
        return this;
    }
    build() {
        return {
            traceId: this.trace.traceId,
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
            createdAt: this.trace.createdAt
        };
    }
}
exports.TraceBuilder = TraceBuilder;
//# sourceMappingURL=reasoning-trace.service.js.map