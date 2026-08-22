export interface RefragChunk {
    id: string;
    documentId: string;
    documentTitle: string;
    content: string;
    score: number;
    rerankedScore?: number;
    metadata?: Record<string, any>;
}
export interface RefragOptions {
    topK?: number;
    minScoreThreshold?: number;
    enableReranking?: boolean;
    maxTokenContextLength?: number;
}
export declare class RefragService {
    /**
     * ReFRAG (Recursive Retrieval-Augmented Generation with Cross-Encoder Reranking)
     * Recupera fragmentos de conocimiento, calcula similitud y aplica re-rankeo recursivo.
     */
    static retrieveAndRerank(query: string, companyId: string, options?: RefragOptions): Promise<{
        chunks: RefragChunk[];
        compressedContext: string;
    }>;
}
