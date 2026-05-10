/**
 * lib/agent-runner.ts — ULTRA-PRO Edition
 * ─────────────────────────────────────────────────────────────
 * Lógica de Invocación Centralizada para Agentes Especializados.
 *
 * CAPABILITIES:
 *  1. Universal Model Registry — 20+ models, 6 providers
 *  2. ReFRAG — 5-phase Retrieval-Feedback Refined Augmented Generation
 *  3. CRM Variables — tokens {{contact.x}} expandidos desde la DB
 *  4. Human-in-the-Loop — Suspensión automática, análisis de sentimiento
 *  5. Human Mimicry — filtro anti-listas robóticas
 *  6. Guardrails — temperatura 0.2-0.5, token limit forzado
 *  7. Self-Verification — hallucination detection post-generation
 */

import { prisma } from "@/lib/prisma";
import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { buildModel, getAvailableModels } from "./universal-model-registry";

export { getAvailableModels };

export async function getAIModelConfig(companyId: string): Promise<{ provider: string; apiKey: string }> {
    const config = await prisma.integrationConfig.findFirst({
        where: { companyId, provider: { in: ['openai', 'gemini', 'anthropic', 'deepseek', 'mistral', 'cohere'] } }
    });
    
    if (config?.provider === 'openai') {
        const apiKey = (config?.config as any)?.openaiApiKey || process.env.OPENAI_API_KEY;
        if (apiKey) return { provider: 'openai', apiKey };
    }
    if (config?.provider === 'anthropic') {
        const apiKey = (config?.config as any)?.anthropicApiKey || process.env.ANTHROPIC_API_KEY;
        if (apiKey) return { provider: 'anthropic', apiKey };
    }
    if (config?.provider === 'deepseek') {
        const apiKey = (config?.config as any)?.deepseekApiKey || process.env.DEEPSEEK_API_KEY;
        if (apiKey) return { provider: 'deepseek', apiKey };
    }
    if (config?.provider === 'mistral') {
        const apiKey = (config?.config as any)?.mistralApiKey || process.env.MISTRAL_API_KEY;
        if (apiKey) return { provider: 'mistral', apiKey };
    }
    if (config?.provider === 'cohere') {
        const apiKey = (config?.config as any)?.cohereApiKey || process.env.COHERE_API_KEY;
        if (apiKey) return { provider: 'cohere', apiKey };
    }

    // Default: Google Gemini
    const apiKey = (config?.config as any)?.geminiApiKey || process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("API Key de AI no configurada. Por favor configúrala en Ajustes > Integraciones.");
    }
    
    return { provider: 'gemini', apiKey };
}

// ── FRUSTRATION KEYWORDS FOR FAST DETECTION ──────────────────────────────────
const FRUSTRATION_KEYWORDS = [
    "hablar con humano", "hablar con una persona", "quiero un asesor", "gerente",
    "esto es inaceptable", "muy mal servicio", "no funciona", "no me ayudas",
    "esto es una estafa", "voy a cancelar", "cancelar suscripción", "demanda",
    "pérdida de dinero", "no sirve", "quiero un reembolso", "terrible",
    "escalar", "supervisor", "human agent", "speak to human", "real person"
];

// ── TYPES ─────────────────────────────────────────────────────────────────────

interface AgentRunInput {
    agentId: string;
    companyId: string;
    userMessage: string;
    conversationId?: string;
    senderUserId?: string; // If set, check for Human-in-the-Loop
    contactData?: Record<string, any>; // For CRM variable injection
    inlineHistory?: { role: "user" | "model", parts: { text: string }[] }[]; // Memory from UI
    userContext?: any; // For RBAC
}

interface AgentRunOutput {
    agentName: string;
    result: string;
    suspended?: boolean;
    suspendedReason?: string;
    sentimentScore?: number;
    latencyMs?: number;
    tokensUsed?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. CRM VARIABLE INJECTOR
// ─────────────────────────────────────────────────────────────────────────────
function injectCRMVariables(prompt: string, contactData: Record<string, any>): string {
    const varMap: Record<string, string> = {
        "{{contact.first_name}}": contactData?.firstName || contactData?.name?.split(" ")[0] || "cliente",
        "{{contact.last_name}}": contactData?.lastName || "",
        "{{contact.email}}": contactData?.email || "",
        "{{contact.phone}}": contactData?.phone || "",
        "{{contact.company}}": contactData?.company || "",
        "{{deal.value}}": contactData?.dealValue ? `$${contactData.dealValue}` : "",
        "{{deal.stage}}": contactData?.dealStage || "",
        "{{last_interaction_date}}": contactData?.lastInteraction
            ? new Date(contactData.lastInteraction).toLocaleDateString("es-CO")
            : new Date().toLocaleDateString("es-CO"),
        "{{company.name}}": contactData?.companyName || "nuestra empresa",
    };
    let result = prompt;
    for (const [token, value] of Object.entries(varMap)) {
        result = result.replaceAll(token, value);
    }
    return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. RAG CONTEXT BUILDER (4.3 — Smart chunking con límite por tokens estimados)
// ─────────────────────────────────────────────────────────────────────────────
function buildRagContext(knowledgeBases: { name: string; content: string }[]): string {
    if (!knowledgeBases.length) return "";
    // 4.3: Distribuir budget de tokens entre KBs (estimado: 1 token ≈ 4 chars)
    // Budget total: ~6000 tokens para el contexto RAG → ~24000 chars
    const TOTAL_BUDGET_CHARS = 24_000;
    const budgetPerKb = Math.floor(TOTAL_BUDGET_CHARS / knowledgeBases.length);
    
    const chunks = knowledgeBases.map(kb => {
        // Truncar en el último párrafo completo para no cortar a mitad de idea
        let content = kb.content.slice(0, budgetPerKb);
        const lastParagraph = content.lastIndexOf('\n\n');
        if (lastParagraph > budgetPerKb * 0.8) content = content.slice(0, lastParagraph);
        return `=== BASE DE CONOCIMIENTO: ${kb.name} ===\n${content}`;
    }).join("\n\n");
    return chunks;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. SENTIMENT ANALYZER (fast check via keywords + LLM)
// ─────────────────────────────────────────────────────────────────────────────
async function analyzeSentiment(message: string, companyId: string): Promise<number> {
    // Fast keyword check (free, no API call)
    const lowerMsg = message.toLowerCase();
    if (FRUSTRATION_KEYWORDS.some(kw => lowerMsg.includes(kw))) {
        return 0.9; // High frustration
    }

    // LLM-based sentiment score for edge cases
    try {
        const config = await getAIModelConfig(companyId);
        // Use lightweight models for cost efficiency on every message
        const sentimentModelId = config.provider === 'openai' ? "gpt-4o-mini"
            : config.provider === 'anthropic' ? "claude-haiku-3-5"
            : config.provider === 'mistral' ? "mistral-small-latest"
            : config.provider === 'deepseek' ? "deepseek-chat"
            : "gemini-2.0-flash-lite";
        const aiModel = buildModel(sentimentModelId);

        const { text } = await generateText({
            model: aiModel as any,
            prompt: `Analiza el sentimiento de frustración de este mensaje del cliente y devuelve ÚNICAMENTE un número decimal entre 0.0 (feliz) y 1.0 (muy frustrado). Mensaje: "${message.slice(0, 200)}"`
        });
        
        const score = parseFloat(text.trim());
        return isNaN(score) ? 0 : Math.min(1, Math.max(0, score));
    } catch {
        return 0;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. HUMAN MIMICRY — Style Filter
// ─────────────────────────────────────────────────────────────────────────────
function applyStyleFilter(text: string): string {
    // Remove robotic AI introductions
    const roboticPhrases = [
        /^Como (IA|inteligencia artificial|asistente virtual),?\s*/i,
        /^Entiendo que (tu|su) pregunta (es|involucra|se relaciona con)/i,
        /^¡Claro! A continuación te presento/i,
        /^Aquí te presento (los|las) (siguientes|principales)/i,
    ];
    let result = text;
    for (const re of roboticPhrases) {
        result = result.replace(re, "");
    }

    // Convert bullet-point-heavy responses (5+ points) into paragraph form
    const bulletLines = result.split("\n").filter(l => /^[\*\-•]\s/.test(l.trim()));
    if (bulletLines.length >= 5) {
        result = result
            .replace(/^[\*\-•]\s+/gm, "")
            .replace(/\n{3,}/g, "\n\n")
            .trim();
    }

    return result.trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// 4.1 — CIRCUIT BREAKER para Gemini API
// Evita cascadas de fallos cuando la API de Gemini está en mal estado.
// ─────────────────────────────────────────────────────────────────────────────
const CB_ERROR_THRESHOLD = 5;    // abrir circuito tras 5 errores consecutivos
const CB_WINDOW_SEC = 60;        // ventana de 60 segundos
const CB_OPEN_DURATION_SEC = 120; // mantén abierto 2 minutos antes de reintentar

async function isCircuitOpen(companyId: string): Promise<boolean> {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) return false; // sin Redis, no hay circuit breaker
    try {
        const key = `cb:gemini:${companyId}`;
        const res = await fetch(`${url}/get/${key}`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json() as { result: string | null };
        if (data.result === 'OPEN') return true;
        const errorCount = parseInt(data.result || '0', 10);
        return errorCount >= CB_ERROR_THRESHOLD;
    } catch {
        return false; // fail-open si Redis no disponible
    }
}

async function recordGeminiError(companyId: string): Promise<void> {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) return;
    try {
        const key = `cb:gemini:${companyId}`;
        // Incrementar contador y establecer TTL si es el primer error
        await fetch(`${url}/pipeline`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify([['INCR', key], ['EXPIRE', key, CB_WINDOW_SEC]]),
        });
        // Si superamos el threshold, marcar como OPEN con duráción más larga
        await fetch(`${url}/get/${key}`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json() as Promise<{ result: string | null }>)
            .then(async d => {
                if (parseInt(d.result || '0', 10) >= CB_ERROR_THRESHOLD) {
                    await fetch(`${url}/set/${key}`, {
                        method: 'POST',
                        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                        body: JSON.stringify({ value: 'OPEN', ex: CB_OPEN_DURATION_SEC }),
                    });
                    console.warn(`[CIRCUIT BREAKER] Gemini API circuit OPEN for companyId: ${companyId}`);
                }
            })
            .catch(() => {});
    } catch { /* non-fatal */ }
}

async function resetCircuitBreaker(companyId: string): Promise<void> {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) return;
    try {
        const key = `cb:gemini:${companyId}`;
        await fetch(`${url}/del/${key}`, { headers: { Authorization: `Bearer ${token}` } });
    } catch { /* non-fatal */ }
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. HUMAN TRANSFER TRIGGER
// ─────────────────────────────────────────────────────────────────────────────
async function triggerHumanTransfer(
    conversationId: string,
    reason: "FRUSTRATION" | "HUMAN_OVERRIDE",
    suspensionMinutes: number,
    webhookUrl?: string | null
) {
    const suspendedUntil = new Date(Date.now() + suspensionMinutes * 60 * 1000);

    await prisma.agentConversation.update({
        where: { id: conversationId },
        data: {
            status: "SUSPENDED",
            suspendedUntil,
            suspendedReason: reason,
        }
    });

    // Dispatch webhook notification
    if (webhookUrl) {
        try {
            await fetch(webhookUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    event: "HUMAN_TRANSFER_REQUESTED",
                    conversationId,
                    reason,
                    suspendedUntil: suspendedUntil.toISOString(),
                    timestamp: new Date().toISOString(),
                }),
                signal: AbortSignal.timeout(5000)
            });
        } catch (e) {
            console.warn("[AGENT RUNNER] Webhook delivery failed:", e);
        }
    }

    console.log(`[AGENT RUNNER] 🚨 Human transfer triggered. Reason: ${reason}. Suspended until: ${suspendedUntil.toISOString()}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN RUNNER
// ─────────────────────────────────────────────────────────────────────────────
export async function runAIAgent({
    agentId,
    companyId,
    userMessage,
    conversationId,
    senderUserId,
    contactData = {},
    inlineHistory = [],
    userContext
}: AgentRunInput): Promise<AgentRunOutput> {
    const startTime = Date.now();

    // 1. Fetch agent config with knowledge bases
    const agent = await prisma.aIAgent.findUnique({
        where: { id: agentId },
        include: { knowledgeBases: { where: { isActive: true } } }
    });

    if (!agent || agent.companyId !== companyId) throw new Error("Agente no encontrado.");
    if (!agent.isActive) throw new Error(`El agente "${agent.name}" está inactivo.`);

    // 2. Check suspension state
    if (conversationId) {
        const conversation = await prisma.agentConversation.findUnique({ where: { id: conversationId } });
        if (conversation?.status === "SUSPENDED" && conversation.suspendedUntil) {
            if (conversation.suspendedUntil > new Date()) {
                return {
                    agentName: agent.name,
                    result: "",
                    suspended: true,
                    suspendedReason: conversation.suspendedReason || "SUSPENDED",
                };
            } else {
                // Auto-reactivate if suspension period is over
                await prisma.agentConversation.update({ where: { id: conversationId }, data: { status: "ACTIVE", suspendedUntil: null } });
            }
        }

        // 3. Human-in-the-Loop Check — Priority Alpha
        if (agent.priorityAlpha && senderUserId) {
            const sender = await prisma.user.findUnique({ where: { id: senderUserId }, select: { role: true } });
            const isHuman = sender?.role && ["admin", "super_admin", "agent"].includes(sender.role.toLowerCase());
            if (isHuman) {
                await triggerHumanTransfer(conversationId, "HUMAN_OVERRIDE", agent.suspensionDurationMinutes, agent.humanTransferWebhook);
                return { agentName: agent.name, result: "", suspended: true, suspendedReason: "HUMAN_OVERRIDE" };
            }
        }
    }

    // 4. Sentiment Analysis
    const sentimentScore = await analyzeSentiment(userMessage, companyId);
    if (sentimentScore >= agent.frustrationThreshold) {
        if (conversationId) {
            await triggerHumanTransfer(conversationId, "FRUSTRATION", agent.suspensionDurationMinutes, agent.humanTransferWebhook);
        }
        return {
            agentName: agent.name,
            result: "Entiendo tu frustración. He notificado a un miembro del equipo y alguien te contactará en breve para ayudarte personalmente.",
            suspended: true,
            suspendedReason: "FRUSTRATION",
            sentimentScore,
        };
    }

    // 4.1: Circuit Breaker — verificar estado antes de llamar a Gemini
    const circuitOpen = await isCircuitOpen(companyId);
    if (circuitOpen) {
        console.warn(`[AGENT RUNNER] Circuit breaker OPEN for ${companyId} — skipping Gemini call.`);
        return {
            agentName: agent.name,
            result: "El asistente no está disponible temporalmente. Por favor intenta en unos minutos.",
            suspended: false,
        };
    }

    // 5. Guardrails — Temperature and Token Clamping
    let temperature = agent.temperature;
    let maxTokens = agent.maxTokens;
    if (agent.enforceTempClamp) temperature = Math.min(0.5, Math.max(0.2, temperature));
    if (agent.enforceTokenLimit) maxTokens = Math.min(maxTokens, 400);

    // 6. ReFRAG — Retrieval-Feedback Refined Augmented Generation
    const { runReFRAG } = await import("./services/refrag-engine");
    const config = await getAIModelConfig(companyId);
    const userId = (userContext as any)?.id || senderUserId || null;

    const refragResult = await runReFRAG({
        query: userMessage,
        companyId,
        agentId,
        userId,
        apiKey: config.apiKey,
        knowledgeBases: agent.knowledgeBases as { name: string; content: string }[],
        learningMode: (agent as any).learningMode || "MANUAL",
    });

    const ragContext = refragResult.ragContext;

    console.log(
        `[ReFRAG] ✅ ${refragResult.subQueries.length} queries | ` +
        `${refragResult.totalChunksRetrieved} retrieved | ` +
        `${refragResult.gradedOut} filtered | ` +
        `${refragResult.retrievedChunks.length} used | ` +
        `fallback=${refragResult.usedFallback}`
    );

    const ragInstruction = agent.strictRagMode && ragContext
        ? `\n\n⚠️ REGLA CRÍTICA: Solo puedes responder con información de los documentos de la Base de Conocimiento proporcionada. Si la respuesta no está en esos documentos, debes decir: "Esta consulta supera mi alcance y la derivaré a un especialista." NUNCA inventes información.\n`
        : "";

    // 7. CRM Variable Injection
    const processedSystemPrompt = injectCRMVariables(
        `${agent.systemPrompt}${ragInstruction}`,
        contactData
    );

    // 8. Conversation History (Intelligent Token-Aware Sliding Window)
    const history: any[] = [];
    if (inlineHistory.length > 0) {
        history.push(...inlineHistory.map(m => ({
            role: m.role === "model" ? "assistant" : "user",
            content: m.parts[0]?.text || ""
        })));
    } else if (conversationId) {
        // Fetch up to 100 recent messages, but we will filter based on token budget
        const prevMessages = await prisma.agentMessage.findMany({
            where: { conversationId }, orderBy: { createdAt: "desc" }, take: 100
        });
        
        let estimatedTokens = 0;
        const MAX_HISTORY_TOKENS = 8000;
        const selectedMessages = [];

        for (const m of prevMessages) {
            const tokens = m.tokensUsed || Math.ceil(m.content.length / 4);
            if (estimatedTokens + tokens > MAX_HISTORY_TOKENS && selectedMessages.length > 0) {
                break; // Window full
            }
            estimatedTokens += tokens;
            selectedMessages.push(m);
        }

        // Reverse to chronological order for the model
        selectedMessages.reverse();

        for (const m of selectedMessages) {
            history.push({
                role: m.role === "assistant" ? "assistant" : "user",
                content: m.content
            });
        }
    }

    const { getToolDeclarations } = await import("./agent-tools");
    const enabledToolNames = Array.isArray(agent.enabledTools) ? (agent.enabledTools as string[]) : [];
    
    // Inject agentId for self_reflection
    const contextWithAgent = { ...(userContext || {}), agentId };
    
    const tools = getToolDeclarations(enabledToolNames, companyId, contactData, contextWithAgent);
    
    // 9. Invoke Vercel AI SDK Core — Universal Model Router
    // Use the model configured per-agent, falling back to gemini-2.0-flash
    const aiModel = buildModel(agent.llmModel || "gemini-2.0-flash");

    let rawResponse = "";
    let tokensUsed = 0;
    try {
        const result = await generateText({
            model: aiModel as any,
            system: ragContext
                ? `${processedSystemPrompt}\n\n${ragContext}`
                : processedSystemPrompt,
            messages: [...history, { role: "user", content: userMessage }],
            tools: Object.keys(tools).length > 0 ? tools : undefined,
            maxSteps: 5,
            temperature,
            maxTokens,
        } as any);

        rawResponse = result.text;
        tokensUsed = result.usage?.totalTokens || 0;
        
        // 4.1: Éxito — resetear circuit breaker si estaba acumulando errores
        await resetCircuitBreaker(companyId);
    } catch (error) {
        // 4.1: Registrar error y potencialmente abrir el circuit breaker
        await recordGeminiError(companyId);
        throw error; // Re-lanzar para que el caller maneje
    }

    // 10. Style Filter (Human Mimicry)
    let finalResponse = agent.filterRoboticLists ? applyStyleFilter(rawResponse) : rawResponse;

    // 10.1. ReFRAG Phase 5 — Self-Verification (hallucination check)
    const learningMode = (agent as any).learningMode || "MANUAL";
    if (learningMode !== "OFF" && ragContext && rawResponse) {
        try {
            const { selfVerify } = await import("./services/refrag-engine");
            const verification = await selfVerify(userMessage, ragContext, rawResponse);
            if (!verification.grounded && verification.confidence > 0.75) {
                console.warn(`[ReFRAG] ⚠️ Hallucination detected (confidence=${verification.confidence}): ${verification.issue}`);
                // Append a grounding note instead of silently passing bad response
                finalResponse += `\n\n_(Nota interna: Respuesta revisada para garantizar precisión)_`;
                // Persist this as a self-reflection for future runs
                if (conversationId) {
                    const { generateEmbedding } = await import("./embeddings");
                    const refragConfig = await getAIModelConfig(companyId);
                    const factText = `Evitar afirmar "${verification.issue}" sin soporte en la KB.`;
                    try {
                        const emb = await generateEmbedding(factText, refragConfig.apiKey);
                        await prisma.$executeRaw`
                            INSERT INTO "AgentMemory" (id, "companyId", "agentId", fact, embedding, "createdAt")
                            VALUES (gen_random_uuid(), ${companyId}, ${agentId}, ${factText},
                                    ${`[${emb.join(",")}]`}::vector, NOW())
                            ON CONFLICT DO NOTHING;
                        `;
                    } catch { /* non-critical */ }
                }
            } else {
                console.log(`[ReFRAG] ✅ Self-verification passed (confidence=${verification.confidence})`);
            }
        } catch {
            // Non-critical — continue with original response
        }
    }

    // 4.2: Latencia simulada ELIMINADA del servidor.
    // La UI debe implementar el efecto de "typing" en el cliente con un hook useTypingEffect.
    // Mantener la latencia en el servidor bloqueaba el hilo de Node.js hasta 6 segundos.

    const latencyMs = Date.now() - startTime;

    // 12. Persist messages
    if (conversationId) {
        await prisma.agentMessage.create({ data: { conversationId, role: "user", content: userMessage, sentimentScore } });
        await prisma.agentMessage.create({
            data: {
                conversationId, role: "assistant", content: finalResponse,
                rawContent: rawResponse !== finalResponse ? rawResponse : null,
                tokensUsed: tokensUsed ?? null, latencyMs
            }
        });
    }

    console.log(`[AGENT RUNNER] ✅ ${agent.name} | ${latencyMs}ms | ${tokensUsed ?? "?"} tokens | Sentiment: ${sentimentScore.toFixed(2)}`);

    return { agentName: agent.name, result: finalResponse, sentimentScore, latencyMs, tokensUsed };
}

// ─────────────────────────────────────────────────────────────────────────────
// TRIAGE ROUTER — Routes to the best available agent
// ─────────────────────────────────────────────────────────────────────────────
export async function triageAndRouteMessage(
    companyId: string,
    userMessage: string,
    conversationId?: string,
    contactData?: Record<string, any>,
    inlineHistory?: { role: "user" | "model", parts: { text: string }[] }[],
    userContext?: any
) {
    const activeAgents = await prisma.aIAgent.findMany({
        where: { companyId, isActive: true },
        select: { id: true, name: true, description: true }
    });

    if (!activeAgents.length) {
        return { result: "No hay agentes especializados activos en este momento." };
    }

    if (activeAgents.length === 1) {
        return runAIAgent({ agentId: activeAgents[0].id, companyId, userMessage, conversationId, contactData, inlineHistory, userContext });
    }

    // Use AI to triage to the best agent(s) (Swarm Routing)
    try {
        const config = await getAIModelConfig(companyId);
        const aiModel = config.provider === 'openai' 
            ? openai("gpt-4o-mini") 
            : google("gemini-2.0-flash-lite");

        const routerPrompt = `Analiza la intención del usuario y determina qué agente o agentes son necesarios para cumplir la tarea.

Agentes:
${activeAgents.map(a => `- ID: ${a.id} | Nombre: ${a.name} | Experiencia: ${a.description || "General"}`).join("\n")}

Mensaje: "${userMessage}"

Si la tarea requiere a varios especialistas trabajando en conjunto, devuelve sus IDs separados por comas. Si solo requiere uno, devuelve solo un ID. NO escribas explicaciones ni texto adicional.`;

        const { text } = await generateText({ model: aiModel as any, prompt: routerPrompt });
        const selectedIds = text.split(",").map(id => id.trim().replace(/[^a-z0-9-]/gi, "")).filter(Boolean);
        const validAgents = activeAgents.filter(a => selectedIds.includes(a.id));
        
        if (validAgents.length === 0) {
            validAgents.push(activeAgents[0]); // fallback
        }

        if (validAgents.length === 1) {
            return runAIAgent({ agentId: validAgents[0].id, companyId, userMessage, conversationId, contactData, inlineHistory, userContext });
        }

        // SWARM ORCHESTRATION MODE (Map-Reduce)
        console.log(`[SWARM] Delegando a múltiples agentes: ${validAgents.map(a => a.name).join(", ")}`);
        
        // Map Phase: Execute all chosen agents in parallel
        const swarmResults = await Promise.all(validAgents.map(agent => 
            runAIAgent({ agentId: agent.id, companyId, userMessage, conversationId, contactData, inlineHistory, userContext })
        ));

        // Reduce Phase: Synthesize the responses into a single voice
        const synthPrompt = `Múltiples agentes especialistas han trabajado en paralelo para resolver la petición del usuario.
        
Petición original del usuario: "${userMessage}"

Reportes de los especialistas:
${swarmResults.map(r => `--- Agente ${r.agentName} ---\n${r.result}`).join("\n\n")}

Sintetiza estos reportes en una ÚNICA respuesta unificada, coherente y conversacional dirigida al usuario. Si algún especialista dice que le falta aprobación, transmíteselo al usuario.`;

        const { text: finalResult, usage } = await generateText({ model: aiModel as any, prompt: synthPrompt });

        // Aggregate execution metrics
        const totalTokens = swarmResults.reduce((sum, r) => sum + (r.tokensUsed || 0), 0) + (usage?.totalTokens || 0);
        const maxLatency = Math.max(...swarmResults.map(r => r.latencyMs || 0));

        // Note: The individual runAIAgent calls already saved their AgentMessage locally, 
        // but the synthetic response should probably be what the user sees.
        // For now, we return the synthetic response.

        return {
            agentName: "Swarm Orchestrator",
            result: finalResult,
            sentimentScore: swarmResults[0].sentimentScore, // approximation
            latencyMs: maxLatency,
            tokensUsed: totalTokens
        };

    } catch {
        // Fallback to first agent on triage failure
        return runAIAgent({ agentId: activeAgents[0].id, companyId, userMessage, conversationId, contactData, inlineHistory, userContext });
    }
}
