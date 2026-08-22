export interface RunAgentInput {
    agentId: string;
    companyId: string;
    userMessage: string;
    conversationId?: string;
    leadId?: string;
    enableRefrag?: boolean;
}
export declare class AiService {
    /**
     * Obtener agentes de IA registrados por empresa
     */
    static getAgents(companyId: string): Promise<any>;
    /**
     * Motor Cognitivo Completo v3.0 Enterprise
     * Pillars: Governance → Guardrails → Quota → CRM → ReFRAG → Tools → HITL → Trace → Feedback
     */
    static runAgent(input: RunAgentInput): Promise<{
        success: boolean;
        agentId: string;
        conversationId: string;
        traceId: string;
        response: string;
        confidenceScore: number;
        autonomyMode: import("./agent-governance.service").AutonomyMode;
        hitlRequired: boolean;
        hitlItem: any;
        refragContextUsed: boolean;
        toolResult: any;
    }>;
}
