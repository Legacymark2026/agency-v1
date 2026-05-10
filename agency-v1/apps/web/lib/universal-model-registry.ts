/**
 * lib/universal-model-registry.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Registro Universal de Modelos de IA para LegacyMark.
 *
 * Soporta: OpenAI · Anthropic · Google Gemini · DeepSeek · Mistral · Cohere
 *
 * Para añadir un proveedor nuevo:
 *   1. npm install @ai-sdk/<proveedor>
 *   2. Importarlo aquí
 *   3. Añadir sus modelos al catálogo MODEL_CATALOG
 *   4. Añadir la API Key al resolver buildModel()
 */

import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import { deepseek } from "@ai-sdk/deepseek";
import { mistral } from "@ai-sdk/mistral";
import { cohere } from "@ai-sdk/cohere";

// ── CATALOG ──────────────────────────────────────────────────────────────────

export interface AIModelMeta {
    id: string;           // ID del modelo tal cual se pasa al SDK
    label: string;        // Nombre que se muestra en la UI
    provider: AIProvider;
    contextWindow: number;
    costTier: "free" | "low" | "medium" | "high";
    supportsTools: boolean;
    description: string;
}

export type AIProvider = "openai" | "anthropic" | "gemini" | "deepseek" | "mistral" | "cohere";

export const MODEL_CATALOG: AIModelMeta[] = [
    // ── OpenAI ──────────────────────────────────────
    {
        id: "gpt-4.1",
        label: "GPT-4.1",
        provider: "openai",
        contextWindow: 1_000_000,
        costTier: "high",
        supportsTools: true,
        description: "El modelo insignia de OpenAI. Máxima calidad de razonamiento."
    },
    {
        id: "gpt-4o",
        label: "GPT-4o",
        provider: "openai",
        contextWindow: 128_000,
        costTier: "high",
        supportsTools: true,
        description: "Modelo multimodal rápido y preciso de OpenAI."
    },
    {
        id: "gpt-4o-mini",
        label: "GPT-4o Mini",
        provider: "openai",
        contextWindow: 128_000,
        costTier: "low",
        supportsTools: true,
        description: "Versión económica de GPT-4o. Ideal para volumen alto."
    },
    {
        id: "o3",
        label: "o3 (Razonamiento)",
        provider: "openai",
        contextWindow: 128_000,
        costTier: "high",
        supportsTools: true,
        description: "Modelo de razonamiento avanzado de OpenAI. Para tareas complejas de análisis."
    },
    {
        id: "o4-mini",
        label: "o4-mini (Razonamiento)",
        provider: "openai",
        contextWindow: 128_000,
        costTier: "medium",
        supportsTools: true,
        description: "Razonamiento avanzado con coste reducido."
    },

    // ── Anthropic (Claude) ───────────────────────────
    {
        id: "claude-opus-4-5",
        label: "Claude Opus 4.5",
        provider: "anthropic",
        contextWindow: 200_000,
        costTier: "high",
        supportsTools: true,
        description: "El modelo más potente de Anthropic. Excelente en escritura y análisis."
    },
    {
        id: "claude-sonnet-4-5",
        label: "Claude Sonnet 4.5",
        provider: "anthropic",
        contextWindow: 200_000,
        costTier: "medium",
        supportsTools: true,
        description: "Equilibrio perfecto entre calidad y velocidad para ventas y soporte."
    },
    {
        id: "claude-haiku-3-5",
        label: "Claude Haiku 3.5",
        provider: "anthropic",
        contextWindow: 200_000,
        costTier: "low",
        supportsTools: true,
        description: "El más veloz y económico de Claude. Ideal para respuestas inmediatas."
    },

    // ── Google Gemini ────────────────────────────────
    {
        id: "gemini-2.5-pro",
        label: "Gemini 2.5 Pro",
        provider: "gemini",
        contextWindow: 1_000_000,
        costTier: "high",
        supportsTools: true,
        description: "El modelo más avanzado de Google. Razonamiento multicapa."
    },
    {
        id: "gemini-2.5-flash",
        label: "Gemini 2.5 Flash",
        provider: "gemini",
        contextWindow: 1_000_000,
        costTier: "medium",
        supportsTools: true,
        description: "Velocidad y contexto masivo. Perfecto para agentes conversacionales."
    },
    {
        id: "gemini-2.0-flash",
        label: "Gemini 2.0 Flash",
        provider: "gemini",
        contextWindow: 128_000,
        costTier: "low",
        supportsTools: true,
        description: "Gemini rápido y económico. Opción predeterminada."
    },
    {
        id: "gemini-2.0-flash-lite",
        label: "Gemini 2.0 Flash Lite",
        provider: "gemini",
        contextWindow: 128_000,
        costTier: "free",
        supportsTools: false,
        description: "El más ligero de Gemini. Respuestas ultra rápidas para FAQs."
    },

    // ── DeepSeek ─────────────────────────────────────
    {
        id: "deepseek-chat",
        label: "DeepSeek V3 Chat",
        provider: "deepseek",
        contextWindow: 128_000,
        costTier: "low",
        supportsTools: true,
        description: "Modelo conversacional chino. Alta calidad a precio muy bajo."
    },
    {
        id: "deepseek-reasoner",
        label: "DeepSeek R1 (Razonamiento)",
        provider: "deepseek",
        contextWindow: 128_000,
        costTier: "low",
        supportsTools: false,
        description: "Razonamiento de nivel o1 a costo mínimo. Ideal para análisis de datos."
    },

    // ── Mistral ──────────────────────────────────────
    {
        id: "mistral-large-latest",
        label: "Mistral Large (Último)",
        provider: "mistral",
        contextWindow: 128_000,
        costTier: "medium",
        supportsTools: true,
        description: "El modelo flagship de Mistral AI. Alta calidad en razonamiento."
    },
    {
        id: "mistral-small-latest",
        label: "Mistral Small (Último)",
        provider: "mistral",
        contextWindow: 128_000,
        costTier: "low",
        supportsTools: true,
        description: "Mistral veloz y económico. Excelente relación calidad/precio."
    },
    {
        id: "codestral-latest",
        label: "Codestral (Código)",
        provider: "mistral",
        contextWindow: 128_000,
        costTier: "medium",
        supportsTools: false,
        description: "Especializado en generación y revisión de código."
    },

    // ── Cohere ───────────────────────────────────────
    {
        id: "command-r-plus",
        label: "Command R+ (Cohere)",
        provider: "cohere",
        contextWindow: 128_000,
        costTier: "medium",
        supportsTools: true,
        description: "Especializado en búsqueda RAG y análisis de documentos empresariales."
    },
    {
        id: "command-r",
        label: "Command R (Cohere)",
        provider: "cohere",
        contextWindow: 128_000,
        costTier: "low",
        supportsTools: true,
        description: "Modelo RAG económico de Cohere. Ideal para bases de conocimiento."
    },
];

// ── RESOLVER ─────────────────────────────────────────────────────────────────

/**
 * Construye el objeto de modelo compatible con Vercel AI SDK
 * basado en el modelId configurado en el agente.
 * Requiere que las API Keys estén disponibles en env vars.
 */
export function buildModel(modelId: string) {
    const meta = MODEL_CATALOG.find(m => m.id === modelId);
    const provider = meta?.provider;

    // Enrutamiento por proveedor
    if (provider === "openai" || (!provider && modelId.startsWith("gpt"))) {
        return openai(modelId);
    }
    if (provider === "anthropic" || modelId.startsWith("claude")) {
        return anthropic(modelId);
    }
    if (provider === "deepseek" || modelId.startsWith("deepseek")) {
        return deepseek(modelId as any);
    }
    if (provider === "mistral" || modelId.includes("mistral") || modelId.includes("codestral")) {
        return mistral(modelId as any);
    }
    if (provider === "cohere" || modelId.startsWith("command")) {
        return cohere(modelId as any);
    }

    // Default: Google Gemini
    return google(modelId || "gemini-2.0-flash");
}

/**
 * Retorna la lista de modelos disponibles para la UI de configuración.
 * Permite filtrar por proveedor o capacidades.
 */
export function getAvailableModels(options?: {
    provider?: AIProvider;
    supportsTools?: boolean;
}): AIModelMeta[] {
    return MODEL_CATALOG.filter(m => {
        if (options?.provider && m.provider !== options.provider) return false;
        if (options?.supportsTools !== undefined && m.supportsTools !== options.supportsTools) return false;
        return true;
    });
}
