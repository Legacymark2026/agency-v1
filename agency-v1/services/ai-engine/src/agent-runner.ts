/**
 * Agent Runner — Migrated from apps/web/lib/agent-runner.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Full AI Agent runtime with ReFRAG, CRM variables, sentiment analysis,
 * circuit breaker, human-in-the-loop, swarm orchestration, and guardrails.
 *
 * Changes from monolith:
 *  - import { prisma } from "@agency/database"
 *  - Redis via ioredis instead of Upstash REST API
 *  - Standalone Express handlers instead of Next.js imports
 */

import { prisma } from "@agency/database";
import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import Redis from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const redis = new Redis(REDIS_URL, { maxRetriesPerRequest: 3, lazyConnect: true });
redis.connect().catch(() => console.warn("[ai-engine] Redis not available for circuit breaker"));

// ─── Universal Model Registry (inline for isolation) ─────────────────────────

function buildModel(modelId: string) {
    // Map model IDs to providers
    if (modelId.startsWith("gpt-") || modelId.startsWith("o1") || modelId.startsWith("o3") || modelId.startsWith("o4")) {
        const { openai } = require("@ai-sdk/openai");
        return openai(modelId);
    }
    if (modelId.startsWith("claude-") || modelId.startsWith("claude3")) {
        const { anthropic } = require("@ai-sdk/anthropic");
        return anthropic(modelId);
    }
    if (modelId.startsWith("deepseek-")) {
        const { createOpenAI } = require("@ai-sdk/openai");
        const deepseek = createOpenAI({ baseURL: "https://api.deepseek.com/v1", apiKey: process.env.DEEPSEEK_API_KEY });
        return deepseek(modelId);
    }
    if (modelId.startsWith("mistral-")) {
        const { createOpenAI } = require("@ai-sdk/openai");
        const mistral = createOpenAI({ baseURL: "https://api.mistral.ai/v1", apiKey: process.env.MISTRAL_API_KEY });
        return mistral(modelId);
    }
    // Default: Google Gemini
    return google(modelId);
}

// ─── AI Config ───────────────────────────────────────────────────────────────

export async function getAIModelConfig(companyId: string) {
    const config = await prisma.integrationConfig.findFirst({
        where: { companyId, provider: { in: ["openai", "gemini", "anthropic", "deepseek", "mistral", "cohere"] } }
    });
    if (config?.provider === "openai") return { provider: "openai", apiKey: (config?.config as any)?.openaiApiKey || process.env.OPENAI_API_KEY };
    if (config?.provider === "anthropic") return { provider: "anthropic", apiKey: (config?.config as any)?.anthropicApiKey || process.env.ANTHROPIC_API_KEY };
    if (config?.provider === "deepseek") return { provider: "deepseek", apiKey: (config?.config as any)?.deepseekApiKey || process.env.DEEPSEEK_API_KEY };
    if (config?.provider === "mistral") return { provider: "mistral", apiKey: (config?.config as any)?.mistralApiKey || process.env.MISTRAL_API_KEY };
    const apiKey = (config?.config as any)?.geminiApiKey || process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("API Key de AI no configurada.");
    return { provider: "gemini", apiKey };
}

// ─── Frustration Keywords ────────────────────────────────────────────────────

const FRUSTRATION_KEYWORDS = [
    "hablar con humano", "hablar con una persona", "quiero un asesor", "gerente",
    "esto es inaceptable", "muy mal servicio", "no funciona", "no me ayudas",
    "voy a cancelar", "cancelar suscripción", "quiero un reembolso", "terrible",
    "escalar", "supervisor", "human agent", "speak to human", "real person"
];

// ─── Types ───────────────────────────────────────────────────────────────────

interface AgentRunInput {
    agentId: string; companyId: string; userMessage: string;
    conversationId?: string; senderUserId?: string;
    contactData?: Record<string, any>;
    inlineHistory?: { role: "user" | "model"; parts: { text: string }[] }[];
    userContext?: any;
}

interface AgentRunOutput {
    agentName: string; result: string; suspended?: boolean;
    suspendedReason?: string; sentimentScore?: number;
    latencyMs?: number; tokensUsed?: number;
}

// ─── CRM Variable Injector ──────────────────────────────────────────────────

function injectCRMVariables(prompt: string, contactData: Record<string, any>): string {
    const varMap: Record<string, string> = {
        "{{contact.first_name}}": contactData?.firstName || contactData?.name?.split(" ")[0] || "cliente",
        "{{contact.last_name}}": contactData?.lastName || "",
        "{{contact.email}}": contactData?.email || "",
        "{{contact.phone}}": contactData?.phone || "",
        "{{deal.value}}": contactData?.dealValue ? `$${contactData.dealValue}` : "",
        "{{deal.stage}}": contactData?.dealStage || "",
        "{{company.name}}": contactData?.companyName || "nuestra empresa",
    };
    let result = prompt;
    for (const [token, value] of Object.entries(varMap)) result = result.replaceAll(token, value);
    return result;
}

// ─── Sentiment Analyzer ─────────────────────────────────────────────────────

async function analyzeSentiment(message: string, companyId: string): Promise<number> {
    const lowerMsg = message.toLowerCase();
    if (FRUSTRATION_KEYWORDS.some(kw => lowerMsg.includes(kw))) return 0.9;
    try {
        const config = await getAIModelConfig(companyId);
        const modelId = config.provider === "openai" ? "gpt-4o-mini" : config.provider === "anthropic" ? "claude-haiku-3-5" : "gemini-2.0-flash-lite";
        const { text } = await generateText({
            model: buildModel(modelId) as any,
            prompt: `Analiza el sentimiento de frustración y devuelve SOLO un número 0.0-1.0. Mensaje: "${message.slice(0, 200)}"`
        });
        const score = parseFloat(text.trim());
        return isNaN(score) ? 0 : Math.min(1, Math.max(0, score));
    } catch { return 0; }
}

// ─── Style Filter (Human Mimicry) ───────────────────────────────────────────

function applyStyleFilter(text: string): string {
    const roboticPhrases = [
        /^Como (IA|inteligencia artificial|asistente virtual),?\s*/i,
        /^Entiendo que (tu|su) pregunta/i,
        /^¡Claro! A continuación te presento/i,
    ];
    let result = text;
    for (const re of roboticPhrases) result = result.replace(re, "");
    const bulletLines = result.split("\n").filter(l => /^[*\-•]\s/.test(l.trim()));
    if (bulletLines.length >= 5) result = result.replace(/^[*\-•]\s+/gm, "").replace(/\n{3,}/g, "\n\n").trim();
    return result.trim();
}

// ─── Circuit Breaker (ioredis instead of Upstash REST) ──────────────────────

const CB_ERROR_THRESHOLD = 5;
const CB_WINDOW_SEC = 60;
const CB_OPEN_DURATION_SEC = 120;

async function isCircuitOpen(companyId: string): Promise<boolean> {
    try {
        const key = `cb:gemini:${companyId}`;
        const val = await redis.get(key);
        if (val === "OPEN") return true;
        return parseInt(val || "0", 10) >= CB_ERROR_THRESHOLD;
    } catch { return false; }
}

async function recordGeminiError(companyId: string): Promise<void> {
    try {
        const key = `cb:gemini:${companyId}`;
        const count = await redis.incr(key);
        await redis.expire(key, CB_WINDOW_SEC);
        if (count >= CB_ERROR_THRESHOLD) {
            await redis.set(key, "OPEN", "EX", CB_OPEN_DURATION_SEC);
            console.warn(`[CIRCUIT BREAKER] Gemini circuit OPEN for ${companyId}`);
        }
    } catch { /* non-fatal */ }
}

async function resetCircuitBreaker(companyId: string): Promise<void> {
    try { await redis.del(`cb:gemini:${companyId}`); } catch { /* non-fatal */ }
}

// ─── Human Transfer ─────────────────────────────────────────────────────────

async function triggerHumanTransfer(conversationId: string, reason: string, minutes: number, webhookUrl?: string | null) {
    const suspendedUntil = new Date(Date.now() + minutes * 60 * 1000);
    await prisma.agentConversation.update({ where: { id: conversationId }, data: { status: "SUSPENDED", suspendedUntil, suspendedReason: reason } });
    if (webhookUrl) {
        try { await fetch(webhookUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ event: "HUMAN_TRANSFER_REQUESTED", conversationId, reason, suspendedUntil: suspendedUntil.toISOString() }), signal: AbortSignal.timeout(5000) }); }
        catch (e) { console.warn("[AGENT RUNNER] Webhook delivery failed:", e); }
    }
    console.log(`[AGENT RUNNER] 🚨 Human transfer. Reason: ${reason}`);
}

// ─── MAIN RUNNER ─────────────────────────────────────────────────────────────

export async function runAIAgent({ agentId, companyId, userMessage, conversationId, senderUserId, contactData = {}, inlineHistory = [], userContext }: AgentRunInput): Promise<AgentRunOutput> {
    const startTime = Date.now();

    const agent = await prisma.aIAgent.findUnique({ where: { id: agentId }, include: { knowledgeBases: { where: { isActive: true } } } });
    if (!agent || agent.companyId !== companyId) throw new Error("Agente no encontrado.");
    if (!agent.isActive) throw new Error(`El agente "${agent.name}" está inactivo.`);

    // Suspension check
    if (conversationId) {
        const conversation = await prisma.agentConversation.findUnique({ where: { id: conversationId } });
        if (conversation?.status === "SUSPENDED" && conversation.suspendedUntil && conversation.suspendedUntil > new Date()) {
            return { agentName: agent.name, result: "", suspended: true, suspendedReason: conversation.suspendedReason || "SUSPENDED" };
        } else if (conversation?.status === "SUSPENDED") {
            await prisma.agentConversation.update({ where: { id: conversationId }, data: { status: "ACTIVE", suspendedUntil: null } });
        }
        // Human-in-the-Loop
        if (agent.priorityAlpha && senderUserId) {
            const sender = await prisma.user.findUnique({ where: { id: senderUserId }, select: { role: true } });
            if (sender?.role && ["admin", "super_admin", "agent"].includes(sender.role.toLowerCase())) {
                await triggerHumanTransfer(conversationId, "HUMAN_OVERRIDE", agent.suspensionDurationMinutes, agent.humanTransferWebhook);
                return { agentName: agent.name, result: "", suspended: true, suspendedReason: "HUMAN_OVERRIDE" };
            }
        }
    }

    // Sentiment
    const sentimentScore = await analyzeSentiment(userMessage, companyId);
    if (sentimentScore >= agent.frustrationThreshold) {
        if (conversationId) await triggerHumanTransfer(conversationId, "FRUSTRATION", agent.suspensionDurationMinutes, agent.humanTransferWebhook);
        return { agentName: agent.name, result: "Entiendo tu frustración. He notificado a un miembro del equipo.", suspended: true, suspendedReason: "FRUSTRATION", sentimentScore };
    }

    // Circuit breaker
    if (await isCircuitOpen(companyId)) {
        return { agentName: agent.name, result: "El asistente no está disponible temporalmente.", suspended: false };
    }

    // Guardrails
    let temperature = agent.temperature;
    let maxTokens = agent.maxTokens;
    if (agent.enforceTempClamp) temperature = Math.min(0.5, Math.max(0.2, temperature));
    if (agent.enforceTokenLimit) maxTokens = Math.min(maxTokens, 400);

    // RAG Context
    const kbs = agent.knowledgeBases as { name: string; content: string }[];
    let ragContext = "";
    if (kbs.length > 0) {
        const BUDGET = 24_000;
        const perKb = Math.floor(BUDGET / kbs.length);
        ragContext = kbs.map(kb => {
            let content = kb.content.slice(0, perKb);
            const last = content.lastIndexOf("\n\n");
            if (last > perKb * 0.8) content = content.slice(0, last);
            return `=== KB: ${kb.name} ===\n${content}`;
        }).join("\n\n");
    }

    const ragInstruction = agent.strictRagMode && ragContext
        ? `\n\n⚠️ REGLA: Solo responde con info de la KB. Si no está, di "derivaré a un especialista."\n`
        : "";

    const processedSystemPrompt = injectCRMVariables(`${agent.systemPrompt}${ragInstruction}`, contactData);

    // Conversation History
    const history: any[] = [];
    if (inlineHistory.length > 0) {
        history.push(...inlineHistory.map(m => ({ role: m.role === "model" ? "assistant" : "user", content: m.parts[0]?.text || "" })));
    } else if (conversationId) {
        const prevMessages = await prisma.agentMessage.findMany({ where: { conversationId }, orderBy: { createdAt: "desc" }, take: 100 });
        let estimatedTokens = 0;
        const selected = [];
        for (const m of prevMessages) {
            const tokens = m.tokensUsed || Math.ceil(m.content.length / 4);
            if (estimatedTokens + tokens > 8000 && selected.length > 0) break;
            estimatedTokens += tokens;
            selected.push(m);
        }
        selected.reverse();
        for (const m of selected) history.push({ role: m.role === "assistant" ? "assistant" : "user", content: m.content });
    }

    // Invoke AI
    const aiModel = buildModel(agent.llmModel || "gemini-2.0-flash");
    let rawResponse = "";
    let tokensUsed = 0;

    try {
        const result = await generateText({
            model: aiModel as any,
            system: ragContext ? `${processedSystemPrompt}\n\n${ragContext}` : processedSystemPrompt,
            messages: [...history, { role: "user", content: userMessage }],
            maxSteps: 5,
            temperature,
            maxTokens,
        } as any);
        rawResponse = result.text;
        tokensUsed = result.usage?.totalTokens || 0;
        await resetCircuitBreaker(companyId);
    } catch (error) {
        await recordGeminiError(companyId);
        throw error;
    }

    const finalResponse = agent.filterRoboticLists ? applyStyleFilter(rawResponse) : rawResponse;
    const latencyMs = Date.now() - startTime;

    // Persist messages
    if (conversationId) {
        await prisma.agentMessage.create({ data: { conversationId, role: "user", content: userMessage, sentimentScore } });
        await prisma.agentMessage.create({ data: { conversationId, role: "assistant", content: finalResponse, rawContent: rawResponse !== finalResponse ? rawResponse : null, tokensUsed, latencyMs } });
    }

    console.log(`[AGENT RUNNER] ✅ ${agent.name} | ${latencyMs}ms | ${tokensUsed} tokens | Sentiment: ${sentimentScore.toFixed(2)}`);
    return { agentName: agent.name, result: finalResponse, sentimentScore, latencyMs, tokensUsed };
}

// ─── TRIAGE ROUTER — Swarm Orchestration ─────────────────────────────────────

export async function triageAndRouteMessage(companyId: string, userMessage: string, conversationId?: string, contactData?: Record<string, any>, inlineHistory?: any[], userContext?: any) {
    const activeAgents = await prisma.aIAgent.findMany({ where: { companyId, isActive: true }, select: { id: true, name: true, description: true } });
    if (!activeAgents.length) return { result: "No hay agentes activos." };
    if (activeAgents.length === 1) return runAIAgent({ agentId: activeAgents[0].id, companyId, userMessage, conversationId, contactData, inlineHistory, userContext });

    try {
        const config = await getAIModelConfig(companyId);
        const aiModel = buildModel(config.provider === "openai" ? "gpt-4o-mini" : "gemini-2.0-flash-lite");
        const routerPrompt = `Analiza la intención y elige agente(s).\nAgentes:\n${activeAgents.map(a => `- ID:${a.id} | ${a.name} | ${a.description || "General"}`).join("\n")}\nMensaje: "${userMessage}"\nDevuelve solo ID(s) separados por comas.`;
        const { text } = await generateText({ model: aiModel as any, prompt: routerPrompt });
        const selectedIds = text.split(",").map(id => id.trim().replace(/[^a-z0-9-]/gi, "")).filter(Boolean);
        const validAgents = activeAgents.filter(a => selectedIds.includes(a.id));
        if (validAgents.length === 0) validAgents.push(activeAgents[0]);
        if (validAgents.length === 1) return runAIAgent({ agentId: validAgents[0].id, companyId, userMessage, conversationId, contactData, inlineHistory, userContext });

        // Swarm: Map-Reduce
        const swarmResults = await Promise.all(validAgents.map(a => runAIAgent({ agentId: a.id, companyId, userMessage, conversationId, contactData, inlineHistory, userContext })));
        const synthPrompt = `Sintetiza estos reportes en una respuesta unificada:\n${swarmResults.map(r => `--- ${r.agentName} ---\n${r.result}`).join("\n\n")}`;
        const { text: finalResult, usage } = await generateText({ model: aiModel as any, prompt: synthPrompt });
        return { agentName: "Swarm Orchestrator", result: finalResult, sentimentScore: swarmResults[0].sentimentScore, latencyMs: Math.max(...swarmResults.map(r => r.latencyMs || 0)), tokensUsed: swarmResults.reduce((s, r) => s + (r.tokensUsed || 0), 0) + (usage?.totalTokens || 0) };
    } catch {
        return runAIAgent({ agentId: activeAgents[0].id, companyId, userMessage, conversationId, contactData, inlineHistory, userContext });
    }
}

export async function disconnectRedis() { await redis.quit(); }
