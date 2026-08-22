export interface HitlItem {
    id: string;
    agentId: string;
    companyId: string;
    conversationId: string;
    userMessage: string;
    proposedResponse: string;
    confidenceScore: number;
    triggerReason: string;
    status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'MODIFIED';
    approvedBy?: string;
    finalResponse?: string;
    createdAt: string;
}
export declare class HitlWorkflowService {
    /**
     * Evalúa si una respuesta del agente requiere supervisión humana (Human-in-the-Loop)
     */
    static shouldRequireHumanReview(userMessage: string, proposedResponse: string, confidenceScore: number, toolExecuted?: string): {
        requiresReview: boolean;
        reason?: string;
    };
    /**
     * Registra una respuesta pendiente de aprobación humana en la cola
     */
    static createPendingReview(input: Omit<HitlItem, 'id' | 'status' | 'createdAt'>): Promise<HitlItem>;
    /**
     * Aprueba o modifica una respuesta retenida por Human-in-the-Loop
     */
    static processDecision(hitlId: string, companyId: string, decision: 'APPROVED' | 'REJECTED' | 'MODIFIED', userId: string, modifiedResponse?: string): Promise<HitlItem>;
    /**
     * Obtiene la lista de ítems pendientes de revisión humana para la empresa
     */
    static getPendingReviews(companyId: string): Promise<HitlItem[]>;
}
