/**
 * Agent Runner — Migrated from apps/web/lib/agent-runner.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Full AI Agent runtime with ReFRAG, CRM variables, sentiment analysis,
 * circuit breaker, human-in-the-loop, swarm orchestration, and guardrails.
 *
 * Changes from monolith:
 *  - import { prisma } from "@agency/database"
 *  - Redis via ioredis instead of Upstash REST API
 *  - Standalone Express handlers instead of Next.js imports
 */
export declare function getAIModelConfig(companyId: string): Promise<{
    provider: string;
    apiKey: any;
}>;
interface AgentRunInput {
    agentId: string;
    companyId: string;
    userMessage: string;
    conversationId?: string;
    senderUserId?: string;
    contactData?: Record<string, any>;
    inlineHistory?: {
        role: "user" | "model";
        parts: {
            text: string;
        }[];
    }[];
    userContext?: any;
}
interface AgentRunOutput {
    agentName: string;
    result: string;
    suspended?: boolean;
    suspendedReason?: string;
    sentimentScore?: number;
    latencyMs?: number;
    tokensUsed?: number;
}
export declare function runAIAgent({ agentId, companyId, userMessage, conversationId, senderUserId, contactData, inlineHistory, userContext }: AgentRunInput): Promise<AgentRunOutput>;
export declare function triageAndRouteMessage(companyId: string, userMessage: string, conversationId?: string, contactData?: Record<string, any>, inlineHistory?: any[], userContext?: any): Promise<AgentRunOutput | {
    result: string;
    agentName?: undefined;
    sentimentScore?: undefined;
    latencyMs?: undefined;
    tokensUsed?: undefined;
} | {
    agentName: string;
    result: string;
    sentimentScore: any;
    latencyMs: number;
    tokensUsed: any;
}>;
export declare function disconnectRedis(): Promise<void>;
export {};
