/**
 * lib/services/refrag-engine.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * ReFRAG — Retrieval-Feedback Refined Augmented Generation
 *
 * 5-phase pipeline that replaces the naive single-vector RAG:
 *
 *  Phase 1 — Query Decomposition  (query-decomposer.ts)
 *  Phase 2 — Parallel Multi-Query Retrieval (pgvector)
 *  Phase 3 — Contextual Grading   (context-grader.ts)
 *  Phase 4 — Context Assembly
 *  Phase 5 — Self-Verification    (hallucination check, if learningMode != OFF)
 */

import { prisma } from "@/lib/prisma";
import { generateText } from "ai";
import { buildModel } from "@/lib/universal-model-registry";
import { decomposeQuery } from "./query-decomposer";
import { gradeChunks, GradedChunk } from "./context-grader";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ReFRAGInput {
    query: string;
    companyId: string;
    agentId: string;
    userId?: string | null;
    apiKey: string;
    knowledgeBases?: { name: string; content: string }[];   // Legacy fallback
    learningMode?: string;
}

export interface ReFRAGResult {
    ragContext: string;
    retrievedChunks: GradedChunk[];
    subQueries: string[];
    totalChunksRetrieved: number;
    gradedOut: number;
    usedFallback: boolean;
    selfReflections: string[];
    userMemories: string[];
}

// ── Phase 2: Parallel Multi-Query Vector Search ───────────────────────────────

async function multiQuerySearch(
    subQueries: string[],
    companyId: string,
    apiKey: string
): Promise<{ name: string; content: string; score: number; queryIndex: number }[]> {
    const { generateEmbedding } = await import("@/lib/embeddings");

    // Generate all embeddings in parallel
    const embeddings = await Promise.all(
        subQueries.map(q => generateEmbedding(q, apiKey).catch(() => null))
    );

    // Search pgvector for each sub-query in parallel
    const searchResults = await Promise.all(
        embeddings.map(async (emb, idx) => {
            if (!emb) return [];
            const vectorString = `[${emb.join(",")}]`;
            try {
                const rows = await prisma.$queryRaw<
                    Array<{ name: string; content: string; similarity: number }>
                >`
                    SELECT name, content,
                           1 - (embedding <=> ${vectorString}::vector) AS similarity
                    FROM knowledge_bases
                    WHERE company_id = ${companyId}
                      AND is_active = true
                      AND embedding IS NOT NULL
                    ORDER BY embedding <=> ${vectorString}::vector
                    LIMIT 4;
                `;
                return rows.map(r => ({ ...r, score: r.similarity, queryIndex: idx }));
            } catch {
                return [];
            }
        })
    );

    // Deduplicate by content hash (use first 120 chars as key)
    const seen = new Set<string>();
    const unique: { name: string; content: string; score: number; queryIndex: number }[] = [];
    for (const batch of searchResults) {
        for (const row of batch) {
            const key = row.content.slice(0, 120);
            if (!seen.has(key)) {
                seen.add(key);
                unique.push(row);
            }
        }
    }

    // Sort by score descending
    return unique.sort((a, b) => b.score - a.score);
}

// ── Phase 2b: Memory Search ───────────────────────────────────────────────────

async function searchMemories(
    queryVector: number[],
    companyId: string,
    userId: string | null,
    agentId: string
): Promise<{ userMemories: string[]; selfReflections: string[] }> {
    const vectorString = `[${queryVector.join(",")}]`;

    const [userMem, selfRef] = await Promise.all([
        userId
            ? prisma.$queryRaw<Array<{ fact: string }>>`
                SELECT fact FROM "AgentMemory"
                WHERE "companyId" = ${companyId}
                  AND "userId" = ${userId}
                  AND embedding IS NOT NULL
                ORDER BY embedding <=> ${vectorString}::vector
                LIMIT 5;
              `.catch(() => [] as { fact: string }[])
            : Promise.resolve([]),
        prisma.$queryRaw<Array<{ fact: string }>>`
            SELECT fact FROM "AgentMemory"
            WHERE "companyId" = ${companyId}
              AND "agentId" = ${agentId}
              AND embedding IS NOT NULL
            ORDER BY embedding <=> ${vectorString}::vector
            LIMIT 5;
          `.catch(() => [] as { fact: string }[]),
    ]);

    return {
        userMemories: userMem.map(m => m.fact),
        selfReflections: selfRef.map(m => m.fact),
    };
}

// ── Phase 5: Self-Verification ────────────────────────────────────────────────

const VERIFIER_SYSTEM = `Eres un verificador de respuestas de IA.
Dada una pregunta, un contexto de conocimiento, y la respuesta generada, determina si la respuesta está FUNDAMENTADA en el contexto.

Responde ÚNICAMENTE con JSON (sin markdown):
{"verdict": "GROUNDED", "confidence": 0.95}
o
{"verdict": "HALLUCINATION", "confidence": 0.87, "issue": "brief description"}`;

export async function selfVerify(
    query: string,
    context: string,
    response: string
): Promise<{ grounded: boolean; confidence: number; issue?: string }> {
    try {
        const model = buildModel("gemini-2.0-flash-lite");
        const { text } = await generateText({
            model: model as any,
            system: VERIFIER_SYSTEM,
            prompt: `PREGUNTA: ${query}\n\nCONTEXTO:\n${context.slice(0, 1500)}\n\nRESPUESTA:\n${response}`,
            maxTokens: 120,
            temperature: 0,
        });
        const clean = text.trim().replace(/```json|```/g, "").trim();
        const result = JSON.parse(clean);
        return {
            grounded: result.verdict === "GROUNDED",
            confidence: result.confidence ?? 1.0,
            issue: result.issue,
        };
    } catch {
        return { grounded: true, confidence: 1.0 };
    }
}

// ── Main ReFRAG Pipeline ──────────────────────────────────────────────────────

export async function runReFRAG(input: ReFRAGInput): Promise<ReFRAGResult> {
    let usedFallback = false;
    let retrievedChunks: GradedChunk[] = [];
    let subQueries: string[] = [input.query];
    let totalChunksRetrieved = 0;
    let gradedOut = 0;
    let userMemories: string[] = [];
    let selfReflections: string[] = [];

    try {
        // ── Phase 1: Query Decomposition ──────────────────────────────────────
        subQueries = await decomposeQuery(input.query);
        console.log(`[ReFRAG] Phase 1 — ${subQueries.length} sub-queries generated`);

        // ── Phase 2: Parallel Multi-Query Retrieval ───────────────────────────
        const rawChunks = await multiQuerySearch(subQueries, input.companyId, input.apiKey);
        totalChunksRetrieved = rawChunks.length;
        console.log(`[ReFRAG] Phase 2 — ${totalChunksRetrieved} chunks retrieved (after dedup)`);

        // ── Phase 2b: Memory Search (using first sub-query embedding) ─────────
        try {
            const { generateEmbedding } = await import("@/lib/embeddings");
            const primaryEmbedding = await generateEmbedding(input.query, input.apiKey);
            const memories = await searchMemories(
                primaryEmbedding,
                input.companyId,
                input.userId ?? null,
                input.agentId
            );
            userMemories = memories.userMemories;
            selfReflections = memories.selfReflections;
            console.log(`[ReFRAG] Phase 2b — ${userMemories.length} user memories, ${selfReflections.length} self-reflections`);
        } catch (e) {
            console.warn("[ReFRAG] Memory search failed:", e);
        }

        // ── Phase 3: Contextual Grading ───────────────────────────────────────
        if (rawChunks.length > 0) {
            const graded = await gradeChunks(input.query, rawChunks);
            gradedOut = totalChunksRetrieved - graded.length;
            retrievedChunks = graded;
            console.log(`[ReFRAG] Phase 3 — ${gradedOut} chunks filtered out, ${graded.length} passed grading`);
        } else if (input.knowledgeBases && input.knowledgeBases.length > 0) {
            // Fallback to legacy KB content
            usedFallback = true;
            retrievedChunks = input.knowledgeBases.map(kb => ({
                name: kb.name, content: kb.content,
                score: 0.5, relevant: true, reason: "legacy fallback"
            }));
        }
    } catch (e) {
        console.error("[ReFRAG] Pipeline error, using legacy fallback:", e);
        usedFallback = true;
        if (input.knowledgeBases && input.knowledgeBases.length > 0) {
            retrievedChunks = input.knowledgeBases.map(kb => ({
                name: kb.name, content: kb.content,
                score: 0.5, relevant: true, reason: "error fallback"
            }));
        }
    }

    // ── Phase 4: Context Assembly ─────────────────────────────────────────────
    const contextParts: string[] = [];

    if (retrievedChunks.length > 0) {
        contextParts.push(
            retrievedChunks
                .map(c => `=== BASE DE CONOCIMIENTO: ${c.name} ===\n${c.content}`)
                .join("\n\n")
        );
    }

    if (userMemories.length > 0) {
        contextParts.push(
            `=== RECUERDOS Y PREFERENCIAS DEL USUARIO ===\n` +
            userMemories.map(m => `- ${m}`).join("\n")
        );
    }

    if (selfReflections.length > 0) {
        contextParts.push(
            `=== APRENDIZAJE CONTINUO (REGLAS APRENDIDAS POR EL AGENTE) ===\n` +
            `Has aprendido las siguientes lecciones. Síguelas estrictamente:\n` +
            selfReflections.map(m => `- ${m}`).join("\n")
        );
    }

    const ragContext = contextParts.join("\n\n");

    return {
        ragContext,
        retrievedChunks,
        subQueries,
        totalChunksRetrieved,
        gradedOut,
        usedFallback,
        selfReflections,
        userMemories,
    };
}
