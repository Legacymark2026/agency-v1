export interface MemoryEntry {
    id: string;
    agentId: string;
    conversationId: string;
    role: 'user' | 'assistant' | 'system' | 'tool';
    content: string;
    metadata?: Record<string, any>;
    timestamp: string;
}
export declare class AgentMemoryService {
    /**
     * Registra una entrada de memoria conversacional en Redis y PostgreSQL
     */
    static addMemory(agentId: string, conversationId: string, role: 'user' | 'assistant' | 'system' | 'tool', content: string, metadata?: Record<string, any>): Promise<MemoryEntry>;
    /**
     * Obtiene el contexto conversacional reciente para pasar al modelo LLM
     */
    static getConversationContext(conversationId: string, limit?: number): Promise<MemoryEntry[]>;
    /**
     * Borra el historial de contexto conversacional de un hilo
     */
    static clearMemory(conversationId: string): Promise<void>;
}
