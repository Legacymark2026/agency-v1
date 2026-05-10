/**
 * lib/services/query-decomposer.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * ReFRAG Phase 1 — Query Refinement & Decomposition
 *
 * Transforma una query compleja en N sub-queries semánticamente diversas
 * para maximizar la cobertura de chunks recuperados en pgvector.
 */

import { generateText } from "ai";
import { buildModel } from "@/lib/universal-model-registry";

const DECOMPOSER_MODEL = "gemini-2.0-flash-lite"; // Ligero y rápido

const DECOMPOSE_SYSTEM = `Eres un experto en reformulación de preguntas para sistemas de búsqueda semántica.
Tu tarea es descomponer la pregunta del usuario en múltiples sub-preguntas que cubran diferentes ángulos semánticos.
Estas sub-preguntas se usarán para recuperar chunks relevantes de una base de conocimiento.

REGLAS:
- Genera entre 2 y 4 sub-preguntas (no más)
- Cada sub-pregunta debe ser semánticamente diferente a las otras
- Conserva el idioma original de la pregunta
- Responde SOLO con un JSON array de strings. Sin explicaciones. Sin markdown.

Ejemplo:
Input: "¿Cómo cancelo mi plan y me reembolsan?"
Output: ["¿Cuál es el proceso de cancelación?","¿Cuáles son las condiciones de reembolso?","¿Qué pasa con mi cuenta al cancelar?"]`;

export async function decomposeQuery(query: string): Promise<string[]> {
    // Short queries don't need decomposition
    if (query.split(" ").length < 6) return [query];

    try {
        const model = buildModel(DECOMPOSER_MODEL);
        const { text } = await generateText({
            model: model,
            system: DECOMPOSE_SYSTEM,
            prompt: query,
            maxTokens: 300,
            temperature: 0.2,
        } as any);

        // Parse JSON array
        const clean = text.trim().replace(/```json|```/g, "").trim();
        const parsed: string[] = JSON.parse(clean);

        if (!Array.isArray(parsed) || parsed.length === 0) return [query];

        // Always include the original query
        const unique = [query, ...parsed.filter(q => q !== query)].slice(0, 5);
        return unique;
    } catch {
        // Fallback: original query only
        return [query];
    }
}
