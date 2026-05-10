"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateText } from "ai";
import { buildModel } from "@/lib/universal-model-registry";
import { runReFRAG } from "@/lib/services/refrag-engine";
import { getAIModelConfig } from "@/lib/agent-runner";

/**
 * actions/agent-ai-builder.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * ReFRAG-powered AI assistant for the Agent Builder Form.
 * Uses the company's Knowledge Bases + ReFRAG pipeline to generate
 * context-aware system prompts, descriptions, and objectives.
 */

// ── Generate System Prompt ────────────────────────────────────────────────────

export async function generateSystemPromptWithAI(data: {
    agentType: string;
    name: string;
    description: string;
    specialization?: string;
}) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("No autenticado.");

    const companyUser = await prisma.companyUser.findFirst({
        where: { userId: session.user.id },
        select: { companyId: true }
    });
    if (!companyUser) throw new Error("Empresa no encontrada.");

    const { companyId } = companyUser;
    const config = await getAIModelConfig(companyId);

    // Phase 1-4: ReFRAG retrieves relevant context from the company's KBs
    const buildQuery = `Crea un agente de IA especializado en ${data.agentType} llamado "${data.name}". ${data.description} ${data.specialization || ""}`;

    const refragResult = await runReFRAG({
        query: buildQuery,
        companyId,
        agentId: "agent-builder",   // pseudo-ID for builder context
        userId: session.user.id,
        apiKey: config.apiKey,
        learningMode: "OFF",        // No self-reflection needed during creation
    }).catch(() => ({
        ragContext: "",
        retrievedChunks: [],
        subQueries: [buildQuery],
        totalChunksRetrieved: 0,
        gradedOut: 0,
        usedFallback: true,
        selfReflections: [],
        userMemories: [],
    }));

    const kbContext = refragResult.ragContext
        ? `\n\nCONTEXTO EMPRESARIAL (extraído de las Bases de Conocimiento de la empresa):\n${refragResult.ragContext.slice(0, 2000)}`
        : "";

    const generatorModel = buildModel(
        config.provider === "openai"    ? "gpt-4o-mini" :
        config.provider === "anthropic" ? "claude-haiku-3-5" :
        "gemini-2.0-flash"
    );

    const { text } = await generateText({
        model: generatorModel,
        system: `Eres un experto en diseño de agentes de IA empresariales. 
Generas system prompts profesionales, específicos y efectivos.
El system prompt debe:
- Definir claramente el rol y personalidad del agente
- Establecer límites claros de lo que puede y no puede hacer
- Incluir instrucciones sobre tono y estilo de comunicación
- Usar el contexto de la empresa si está disponible
- Estar en el mismo idioma que el nombre del agente
- Tener entre 150-300 palabras
- NO incluir instrucciones sobre herramientas (esas se configuran por separado)`,
        prompt: `Tipo de agente: ${data.agentType}
Nombre: ${data.name}
Descripción del objetivo: ${data.description}
Especialización adicional: ${data.specialization || "Ninguna"}${kbContext}

Genera un system prompt profesional y completo para este agente.`,
        maxTokens: 500,
        temperature: 0.4,
    } as any);

    return {
        systemPrompt: text,
        usedKBChunks: refragResult.retrievedChunks.length,
        subQueries: refragResult.subQueries.length,
    };
}

// ── Suggest Agent Name ────────────────────────────────────────────────────────

export async function suggestAgentNames(agentType: string, domain: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("No autenticado.");

    const companyUser = await prisma.companyUser.findFirst({
        where: { userId: session.user.id },
        select: { companyId: true }
    });
    if (!companyUser) throw new Error("Empresa no encontrada.");

    const config = await getAIModelConfig(companyUser.companyId);
    const model = buildModel("gemini-2.0-flash-lite");

    const { text } = await generateText({
        model: model,
        system: `Generates 5 creative, professional agent names. Respond ONLY with a JSON array of strings. No markdown.`,
        prompt: `Agent type: ${agentType}. Business domain: ${domain}. Generate 5 names.`,
        maxTokens: 150,
        temperature: 0.8,
    } as any);

    try {
        const clean = text.trim().replace(/```json|```/g, "").trim();
        return { names: JSON.parse(clean) as string[] };
    } catch {
        return { names: [`${agentType} Assistant`, `${domain} Agent`, `Smart ${agentType}`] };
    }
}
