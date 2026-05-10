/**
 * lib/services/context-grader.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * ReFRAG Phase 3 — Contextual Relevance Grading
 *
 * Evalúa cada chunk recuperado y filtra los irrelevantes antes de que
 * lleguen al prompt del LLM principal. Elimina ruido y reduce alucinaciones.
 */

import { generateText } from "ai";
import { buildModel } from "@/lib/universal-model-registry";

const GRADER_MODEL = "gemini-2.0-flash-lite";

export interface GradedChunk {
    name: string;
    content: string;
    score: number;       // cosine similarity from pgvector
    relevant: boolean;
    reason?: string;
}

const GRADER_SYSTEM = `Eres un evaluador de relevancia para un sistema RAG. 
Recibirás una pregunta del usuario y un fragmento de documento.
Decide si el fragmento contiene información útil para responder la pregunta.

Responde ÚNICAMENTE con JSON en este formato (sin markdown, sin texto extra):
{"relevant": true, "reason": "brief reason"}
o
{"relevant": false, "reason": "brief reason"}`;

async function gradeChunk(query: string, chunk: { name: string; content: string; score: number }): Promise<GradedChunk> {
    try {
        const model = buildModel(GRADER_MODEL);
        const { text } = await generateText({
            model: model as any,
            system: GRADER_SYSTEM,
            prompt: `PREGUNTA: ${query}\n\nFRAGMENTO (${chunk.name}):\n${chunk.content.slice(0, 800)}`,
            maxTokens: 100,
            temperature: 0,
        });

        const clean = text.trim().replace(/```json|```/g, "").trim();
        const result = JSON.parse(clean);
        return { ...chunk, relevant: result.relevant ?? true, reason: result.reason };
    } catch {
        // On error, assume relevant to avoid false negatives
        return { ...chunk, relevant: true };
    }
}

/**
 * Grade all chunks in parallel and return only relevant ones.
 * Minimum guarantee: if ALL are graded irrelevant, return top-2 by score
 * (failsafe to avoid empty context).
 */
export async function gradeChunks(
    query: string,
    chunks: { name: string; content: string; score?: number }[]
): Promise<GradedChunk[]> {
    if (chunks.length === 0) return [];

    // Grade all in parallel
    const graded = await Promise.all(
        chunks.map(c => gradeChunk(query, { ...c, score: c.score ?? 1.0 }))
    );

    const relevant = graded.filter(c => c.relevant);

    // Failsafe: always return at least the top-scored chunk
    if (relevant.length === 0) {
        const sorted = [...graded].sort((a, b) => b.score - a.score);
        return sorted.slice(0, 2).map(c => ({ ...c, relevant: true, reason: "failsafe: top-score" }));
    }

    return relevant;
}
