/**
 * lib/ml/embeddings.ts
 * ─────────────────────────────────────────────────────────────
 * Motor de Generación y Comparación de Vectores (Vector Embeddings).
 * 
 * Este módulo expone la interfaz para convertir texto libre
 * (Ej. búsquedas en Knowledge Base, descripción de un Lead) en
 * vectores matemáticos densos, que permiten búsquedas semánticas.
 */

// import { embed, cosineSimilarity } from 'ai';
// import { google } from '@ai-sdk/google'; // e.g., text-embedding-004

export class VectorEngine {
    
    /**
     * Convierte un texto en un vector numérico (Embedding)
     * usando el modelo nativo configurado.
     */
    static async generateEmbedding(text: string): Promise<number[]> {
        if (!text.trim()) return [];

        /* IMPLEMENTACIÓN REAL:
        const { embedding } = await embed({
            model: google.textEmbeddingModel('text-embedding-004'),
            value: text,
        });
        return embedding;
        */

        // Mock Vector Output (1536/768 dimensiones típicamente)
        console.log(`[ML] Generando Vector Embedding para: "${text.substring(0, 30)}..."`);
        const mockDimensions = 768;
        return Array.from({ length: mockDimensions }, () => Math.random() * 2 - 1);
    }

    /**
     * Calcula la Similitud del Coseno entre dos embeddings.
     * Retorna un valor entre -1.0 a 1.0 (1.0 = Idénticos semánticamente).
     */
    static calculateSimilarity(vecA: number[], vecB: number[]): number {
        if (vecA.length !== vecB.length || vecA.length === 0) {
            throw new Error("Los vectores deben tener la misma dimensionalidad.");
        }

        let dotProduct = 0;
        let normA = 0;
        let normB = 0;

        for (let i = 0; i < vecA.length; i++) {
            dotProduct += vecA[i] * vecB[i];
            normA += vecA[i] * vecA[i];
            normB += vecB[i] * vecB[i];
        }

        if (normA === 0 || normB === 0) return 0;

        // return cosineSimilarity(vecA, vecB) // Si usamos la tool del Vercel AI SDK directamente
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }
}
