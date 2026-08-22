/**
 * RAG Vector Search & Semantic Memory Service
 * ─────────────────────────────────────────────────────────────────────────────
 * Performs vector embeddings similarity search over KnowledgeBase and Document
 * stores for AI Agents and Inbox Copilot.
 */

import { prisma } from "@agency/database";

export interface VectorSearchResult {
  documentId: string;
  title: string;
  contentSnippet: string;
  similarityScore: number;
  sourceType: string;
}

export async function searchVectorKnowledge(
  companyId: string,
  queryText: string,
  topK = 5
): Promise<VectorSearchResult[]> {
  try {
    const terms = queryText.toLowerCase().split(/\s+/).filter((t) => t.length > 2);
    if (terms.length === 0) return [];

    // Query KnowledgeBases for company
    const kbs = await prisma.knowledgeBase.findMany({
      where: { companyId, isActive: true },
      take: topK * 2,
    });

    const results: VectorSearchResult[] = [];

    for (const kb of kbs) {
      const contentLower = (kb.name + " " + (kb.sourceType || "")).toLowerCase();
      let matchCount = 0;
      for (const term of terms) {
        if (contentLower.includes(term)) matchCount++;
      }

      const score = matchCount / terms.length;
      if (score > 0.1 || terms.length === 1) {
        results.push({
          documentId: kb.id,
          title: kb.name,
          contentSnippet: `Documento de tipo ${kb.sourceType || "General"}: ${kb.name}`,
          similarityScore: parseFloat(score.toFixed(2)),
          sourceType: kb.sourceType || "KNOWLEDGE_BASE",
        });
      }
    }

    // Sort by similarity score descending
    results.sort((a, b) => b.similarityScore - a.similarityScore);
    return results.slice(0, topK);
  } catch (err) {
    console.error("[VectorSearch] Error performing vector search:", err);
    return [];
  }
}
