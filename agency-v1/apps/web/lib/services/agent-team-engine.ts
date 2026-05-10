/**
 * lib/services/agent-team-engine.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Parallel Workforce Orchestration Engine — Agent Teams
 *
 * Estrategias de ejecución:
 *   PARALLEL   — Todos los agentes corren en paralelo (Promise.allSettled).
 *                Ideal para análisis, investigación, generación de contenido.
 *   SEQUENTIAL — Los agentes corren en orden de prioridad.
 *                El output de cada agente se pasa como contexto al siguiente.
 *   VOTE       — Todos los agentes responden en paralelo.
 *                Un sintetizador elige/combina la mejor respuesta.
 */

import { prisma } from "@/lib/prisma";
import { runAIAgent } from "@/lib/agent-runner";
import { buildModel } from "@/lib/universal-model-registry";
import { generateText } from "ai";
import { runReFRAG } from "@/lib/services/refrag-engine";
import { decomposeQuery } from "@/lib/services/query-decomposer";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TeamRunInput {
    teamId: string;
    companyId: string;
    input: string;
    trigger?: "MANUAL" | "WEBHOOK" | "SCHEDULE";
    userContext?: any;
    contactData?: Record<string, any>;
}

export interface AgentOutput {
    agentId: string;
    agentName: string;
    role: string;
    result: string;
    latencyMs: number;
    tokensUsed: number;
    error?: string;
}

export interface TeamRunResult {
    runId: string;
    teamName: string;
    strategy: string;
    agentOutputs: AgentOutput[];
    synthesis: string;
    totalLatencyMs: number;
    totalTokens: number;
    status: "COMPLETED" | "PARTIAL" | "FAILED";
}

// ── Main Engine ───────────────────────────────────────────────────────────────

export async function executeAgentTeam(input: TeamRunInput): Promise<TeamRunResult> {
    const start = Date.now();

    // 1. Load team config with all members and their agents
    const team = await prisma.agentTeam.findUnique({
        where: { id: input.teamId, companyId: input.companyId },
        include: {
            members: {
                orderBy: { priority: "asc" },
                include: { agent: true }
            }
        }
    });

    if (!team) throw new Error("Equipo no encontrado.");
    if (!team.isActive) throw new Error(`El equipo "${team.name}" está inactivo.`);
    if (team.members.length === 0) throw new Error("El equipo no tiene miembros asignados.");

    // 2. Create the run record
    const run = await prisma.agentTeamRun.create({
        data: {
            teamId: team.id,
            companyId: input.companyId,
            trigger: input.trigger || "MANUAL",
            input: input.input,
            status: "RUNNING",
        }
    });

    let agentOutputs: AgentOutput[] = [];
    let synthesis = "";
    let status: "COMPLETED" | "PARTIAL" | "FAILED" = "COMPLETED";

    try {
        // 3. Execute based on strategy
        if (team.strategy === "PARALLEL" || team.strategy === "VOTE") {
            agentOutputs = await executeParallel(team.members, input);
        } else {
            agentOutputs = await executeSequential(team.members, input);
        }

        const successCount = agentOutputs.filter(o => !o.error).length;
        if (successCount === 0) status = "FAILED";
        else if (successCount < agentOutputs.length) status = "PARTIAL";

        // 4. Synthesize final output
        synthesis = await synthesizeOutputs(
            team.name,
            team.objective,
            team.strategy,
            input.input,
            agentOutputs,
            input.companyId,
            team.id
        );

    } catch (err: any) {
        status = "FAILED";
        synthesis = `Error crítico del equipo: ${err.message}`;
    }

    const totalLatencyMs = Date.now() - start;
    const totalTokens = agentOutputs.reduce((sum, o) => sum + o.tokensUsed, 0);
    const outputsMap: Record<string, string> = {};
    agentOutputs.forEach(o => { outputsMap[o.agentId] = o.result; });

    // 5. Persist run results
    await prisma.agentTeamRun.update({
        where: { id: run.id },
        data: {
            status,
            outputs: outputsMap,
            synthesis,
            latencyMs: totalLatencyMs,
            tokensTotal: totalTokens,
        }
    });

    return {
        runId: run.id,
        teamName: team.name,
        strategy: team.strategy,
        agentOutputs,
        synthesis,
        totalLatencyMs,
        totalTokens,
        status
    };
}

// ── Execution Strategies ───────────────────────────────────────────────────────

async function executeParallel(
    members: any[],
    input: TeamRunInput
): Promise<AgentOutput[]> {
    const tasks = members.map(async (member) => {
        const memberStart = Date.now();
        try {
            const result = await runAIAgent({
                agentId: member.agentId,
                companyId: input.companyId,
                userMessage: buildMemberPrompt(member.role, input.input, member.agent.agentType),
                contactData: input.contactData,
                userContext: input.userContext,
            });
            return {
                agentId: member.agentId,
                agentName: member.agent.name,
                role: member.role,
                result: result.result,
                latencyMs: Date.now() - memberStart,
                tokensUsed: result.tokensUsed || 0,
            } as AgentOutput;
        } catch (err: any) {
            return {
                agentId: member.agentId,
                agentName: member.agent.name,
                role: member.role,
                result: "",
                latencyMs: Date.now() - memberStart,
                tokensUsed: 0,
                error: err.message,
            } as AgentOutput;
        }
    });

    const settled = await Promise.allSettled(tasks);
    return settled.map(r => r.status === "fulfilled" ? r.value : {
        agentId: "unknown", agentName: "unknown", role: "WORKER",
        result: "", latencyMs: 0, tokensUsed: 0,
        error: r.reason?.message || "Unknown error"
    });
}

async function executeSequential(
    members: any[],
    input: TeamRunInput
): Promise<AgentOutput[]> {
    const outputs: AgentOutput[] = [];
    let accumulatedContext = input.input;

    for (const member of members) {
        const memberStart = Date.now();
        try {
            const contextualPrompt = outputs.length > 0
                ? `${accumulatedContext}\n\n=== CONTEXTO DE AGENTES PREVIOS ===\n${outputs.map(o => `[${o.agentName}]: ${o.result}`).join("\n\n")}`
                : accumulatedContext;

            const result = await runAIAgent({
                agentId: member.agentId,
                companyId: input.companyId,
                userMessage: buildMemberPrompt(member.role, contextualPrompt, member.agent.agentType),
                contactData: input.contactData,
                userContext: input.userContext,
            });

            const output: AgentOutput = {
                agentId: member.agentId,
                agentName: member.agent.name,
                role: member.role,
                result: result.result,
                latencyMs: Date.now() - memberStart,
                tokensUsed: result.tokensUsed || 0,
            };
            outputs.push(output);
            accumulatedContext = result.result; // Pass output as context to next agent
        } catch (err: any) {
            outputs.push({
                agentId: member.agentId, agentName: member.agent.name,
                role: member.role, result: "", latencyMs: Date.now() - memberStart,
                tokensUsed: 0, error: err.message,
            });
        }
    }
    return outputs;
}

// ── Synthesizer (ReFRAG-powered) ─────────────────────────────────────────────

async function synthesizeOutputs(
    teamName: string,
    objective: string,
    strategy: string,
    originalInput: string,
    outputs: AgentOutput[],
    companyId: string,
    teamId: string
): Promise<string> {
    const successfulOutputs = outputs.filter(o => !o.error && o.result.trim());

    if (successfulOutputs.length === 0) return "Ningún agente del equipo pudo completar la tarea.";
    if (successfulOutputs.length === 1) return successfulOutputs[0].result;

    // SEQUENTIAL: last agent output IS the synthesis
    if (strategy === "SEQUENTIAL") return successfulOutputs[successfulOutputs.length - 1].result;

    // PARALLEL/VOTE: ReFRAG-powered synthesis
    try {
        const { getAIModelConfig } = await import("@/lib/agent-runner");
        const config = await getAIModelConfig(companyId);

        // Phase 1: Decompose the synthesis task into sub-queries
        const synthSubQueries = await decomposeQuery(
            `${objective} ${originalInput}`
        ).catch(() => [originalInput]);

        // Phase 2: Retrieve team-relevant KB context via ReFRAG
        const refragResult = await runReFRAG({
            query: originalInput,
            companyId,
            agentId: teamId,  // Use teamId as pseudo-agentId for team memories
            userId: null,
            apiKey: config.apiKey,
            learningMode: "MANUAL",
        }).catch(() => ({ ragContext: "", retrievedChunks: [], subQueries: [originalInput], totalChunksRetrieved: 0, gradedOut: 0, usedFallback: true, selfReflections: [], userMemories: [] }));

        const synthModel = buildModel(
            config.provider === "openai"    ? "gpt-4o-mini" :
            config.provider === "anthropic" ? "claude-haiku-3-5" :
            "gemini-2.0-flash"
        );

        const agentContext = successfulOutputs
            .map(o => `### ${o.agentName} (${o.role})\n${o.result}`)
            .join("\n\n---\n\n");

        const kbContext = refragResult.ragContext
            ? `\n\n=== CONTEXTO ADICIONAL DE BASES DE CONOCIMIENTO ===\n${refragResult.ragContext.slice(0, 2000)}`
            : "";

        const prompt = `Eres un sintetizador experto del equipo "${teamName}".

OBJETIVO DEL EQUIPO: ${objective}

SOLICITUD ORIGINAL: ${originalInput}${kbContext}

RESPUESTAS DE LOS AGENTES:
${agentContext}

INSTRUCCIÓN: Sintetiza en una única respuesta coherente, completa y accionable.
- Integra los mejores puntos de cada agente
- Usa el contexto de las KBs si añade valor
- Elimina redundancias
- No menciones agentes internos
- Habla como una sola voz experta y directa`;

        const { text } = await generateText({ model: synthModel, prompt, maxTokens: 800 } as any);
        console.log(`[ReFRAG] Team synthesizer used ${refragResult.retrievedChunks.length} KB chunks (${refragResult.subQueries.length} sub-queries)`);
        return text;
    } catch {
        return successfulOutputs.map(o => `**${o.agentName}**: ${o.result}`).join("\n\n");
    }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildMemberPrompt(role: string, input: string, agentType: string): string {
    const roleInstructions: Record<string, string> = {
        ORCHESTRATOR: `Como orquestador del equipo, analiza la siguiente solicitud y proporciona la dirección estratégica:\n\n${input}`,
        WORKER:       input,
        REVIEWER:     `Revisa y valida críticamente el siguiente contenido. Señala cualquier error, inconsistencia o mejora posible:\n\n${input}`,
        SYNTHESIZER:  `Sintetiza y consolida la siguiente información en una respuesta concisa y accionable:\n\n${input}`,
    };
    return roleInstructions[role] || input;
}
