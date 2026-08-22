export interface TraceStep {
    step: number;
    phase: string;
    label: string;
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
export declare class ReasoningTraceService {
    private static makeTraceId;
    /** Create a new in-memory trace builder */
    static createBuilder(agentId: string, companyId: string, conversationId: string, userMessage: string): TraceBuilder;
    /** Persist a completed trace to Redis (TTL = 24h) */
    static saveTrace(trace: ReasoningTrace): Promise<void>;
    /** Retrieve paginated traces for a company */
    static listTraces(companyId: string, limit?: number, offset?: number): Promise<ReasoningTrace[]>;
    /** Get a single trace by ID */
    static getTrace(companyId: string, traceId: string): Promise<ReasoningTrace | null>;
}
export declare class TraceBuilder {
    private agentId;
    private companyId;
    private conversationId;
    private userMessage;
    private startTime;
    private stepTime;
    private steps;
    private stepIndex;
    private toolsExecuted;
    private refragChunksUsed;
    private refragTopScore;
    private hitlRequired;
    private hitlReason?;
    private finalResponse;
    private confidenceScore;
    private autonomyMode;
    private temperature;
    private totalTokensUsed;
    private trace;
    constructor(agentId: string, companyId: string, conversationId: string, userMessage: string);
    addStep(phase: string, label: string, status: "OK" | "WARN" | "BLOCKED", detail?: Record<string, any>): this;
    setGovernance(autonomyMode: string, temperature: number): this;
    setRefrag(chunksUsed: number, topScore: number): this;
    addTool(toolName: string): this;
    setHitl(required: boolean, reason?: string): this;
    setResponse(response: string, confidenceScore: number): this;
    setTokens(tokens: number): this;
    build(): ReasoningTrace;
}
