export declare class MemoryVectorService {
    /**
     * Generates a 1536-dimension embedding vector mock or call OpenAI/Gemini
     */
    static generateEmbedding(text: string): Promise<number[]>;
    /**
     * Saves memory text with generated embedding to the database (uses pgvector)
     */
    static saveMemoryWithVector(agentId: string, content: string, metadata?: Record<string, any>): Promise<void>;
    /**
     * Searches for top k matching memories using pgvector cosine distance operator (<=>)
     */
    static searchMemory(agentId: string, query: string, limit?: number): Promise<any[]>;
}
