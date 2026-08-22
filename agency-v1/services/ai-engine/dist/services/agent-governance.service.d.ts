export type AutonomyMode = "AUTONOMOUS" | "SEMI_AUTONOMOUS" | "SUPERVISED_ONLY";
export interface AgentGovernanceConfig {
    agentId: string;
    companyId: string;
    autonomyMode: AutonomyMode;
    temperature: number;
    dailyTokenBudget: number;
    monthlyUsdBudget: number;
    hitlConfidenceThreshold: number;
    hitlHighValueQuoteUsd: number;
    allowedTools: string[];
    systemPromptOverride?: string;
    isActive: boolean;
    updatedAt: string;
}
export declare class AgentGovernanceService {
    private static cacheKey;
    /**
     * Retrieves the governance configuration for an agent.
     * Priority: Redis cache → PostgreSQL → defaults.
     */
    static getConfig(companyId: string, agentId: string): Promise<AgentGovernanceConfig>;
    /**
     * Saves or updates the governance configuration for an agent (upsert).
     */
    static upsertConfig(companyId: string, agentId: string, updates: Partial<Omit<AgentGovernanceConfig, "agentId" | "companyId" | "updatedAt">>): Promise<AgentGovernanceConfig>;
    /**
     * Evaluates whether a response MUST go through HITL given the governance config.
     * Returns the final effective HITL decision with reason.
     */
    static evaluateHitl(config: AgentGovernanceConfig, confidenceScore: number, toolExecuted?: string, quoteAmount?: number, userMessage?: string): {
        requiresReview: boolean;
        reason?: string;
    };
    /**
     * Returns all governance configs for a company (admin panel)
     */
    static listConfigs(companyId: string): Promise<AgentGovernanceConfig[]>;
}
