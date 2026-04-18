/**
 * lib/agent-runner.ts — ULTRA-PRO Edition
 * ─────────────────────────────────────────────────────────────
 * Lógica de Invocación Centralizada para Agentes Especializados.
 *
 * CAPABILITIES:
 *  1. Real Gemini SDK (gemini-2.0-flash) — no más mocks
 *  2. RAG — inyección de Knowledge Base como contexto de verdad absoluta
 *  3. CRM Variables — tokens {{contact.x}} expandidos desde la DB
 *  4. Human-in-the-Loop — Suspensión automática, análisis de sentimiento
 *  5. Human Mimicry — latencia simulada, filtro anti-listas robóticas
 *  6. Guardrails — temperatura 0.2-0.5, token limit forzado
 */

import { prisma } from "@/lib/prisma";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

async function getGeminiKey(companyId: string): Promise<string> {
    const config = await prisma.integrationConfig.findUnique({
        where: { companyId_provider: { companyId, provider: 'gemini' } }
    });
    
    const apiKey = (config?.config as any)?.geminiApiKey || process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
        throw new Error("API Key de Gemini no configurada. Por favor configúrala en Ajustes > Integraciones.");
    }
    
    return apiKey;
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
// 2. RAG CONTEXT BUILDER
// ─────────────────────────────────────────────────────────────────────────────
function buildRagContext(knowledgeBases: { name: string; content: string }[]): string {
    if (!knowledgeBases.length) return "";
    const chunks = knowledgeBases.map(kb =>
        `=== BASE DE CONOCIMIENTO: ${kb.name} ===\n${kb.content.slice(0, 3000)}`
    ).join("\n\n");
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
        const apiKey = await getGeminiKey(companyId);
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });
        const result = await model.generateContent(
            `Analiza el sentimiento de frustración de este mensaje del cliente y devuelve ÚNICAMENTE un número decimal entre 0.0 (feliz) y 1.0 (muy frustrado). Mensaje: "${message.slice(0, 200)}"`
        );
        const score = parseFloat(result.response.text().trim());
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
    inlineHistory = []
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

    // 5. Guardrails — Temperature and Token Clamping
    let temperature = agent.temperature;
    let maxTokens = agent.maxTokens;
    if (agent.enforceTempClamp) temperature = Math.min(0.5, Math.max(0.2, temperature));
    if (agent.enforceTokenLimit) maxTokens = Math.min(maxTokens, 400);

    // 6. Build RAG Context
    const ragContext = buildRagContext(agent.knowledgeBases);
    const ragInstruction = agent.strictRagMode && ragContext
        ? `\n\n⚠️ REGLA CRÍTICA: Solo puedes responder con información de los documentos de la Base de Conocimiento. Si la respuesta no está en esos documentos, debes decir: "Esta consulta supera mi alcance y la derivaré a un especialista." NUNCA inventes información.\n`
        : "";

    // 7. CRM Variable Injection
    const processedSystemPrompt = injectCRMVariables(
        `${agent.systemPrompt}${ragInstruction}`,
        contactData
    );

    // 8. Conversation History
    const history: { role: "user" | "model", parts: { text: string }[] }[] = [];
    if (inlineHistory.length > 0) {
        history.push(...inlineHistory);
    } else if (conversationId) {
        const prevMessages = await prisma.agentMessage.findMany({
            where: { conversationId }, orderBy: { createdAt: "asc" }, take: 20
        });
        for (const m of prevMessages) {
            history.push({
                role: m.role === "assistant" ? "model" : "user",
                parts: [{ text: m.content }]
            });
        }
    }

    // 9. Invoke Gemini SDK
    const apiKey = await getGeminiKey(companyId);
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
        model: agent.llmModel,
        systemInstruction: ragContext
            ? `${processedSystemPrompt}\n\n${ragContext}`
            : processedSystemPrompt,
        generationConfig: { temperature, maxOutputTokens: maxTokens },
        safetySettings: [
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        ]
    });

    const chat = model.startChat({ history });
    const geminiResult = await chat.sendMessage(userMessage);
    const rawResponse = geminiResult.response.text();
    const tokensUsed = geminiResult.response.usageMetadata?.totalTokenCount;

    // 10. Style Filter (Human Mimicry)
    const finalResponse = agent.filterRoboticLists ? applyStyleFilter(rawResponse) : rawResponse;

    // 11. Simulated Typing Latency
    if (agent.simulateLatency) {
        const delay = Math.min(Math.round(finalResponse.length / 50) * 1000, 6000);
        await new Promise(resolve => setTimeout(resolve, delay));
    }

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
    inlineHistory?: { role: "user" | "model", parts: { text: string }[] }[]
) {
    const activeAgents = await prisma.aIAgent.findMany({
        where: { companyId, isActive: true },
        select: { id: true, name: true, description: true }
    });

    if (!activeAgents.length) {
        return { result: "No hay agentes especializados activos en este momento." };
    }

    if (activeAgents.length === 1) {
        return runAIAgent({ agentId: activeAgents[0].id, companyId, userMessage, conversationId, contactData, inlineHistory });
    }

    // Use Gemini to triage to the best agent
    try {
        const apiKey = await getGeminiKey(companyId);
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });
        const routerPrompt = `Analiza la intención del usuario y elige el agente más apropiado.

Agentes:
${activeAgents.map(a => `- ID: ${a.id} | Nombre: ${a.name} | Experiencia: ${a.description || "General"}`).join("\n")}

Mensaje: "${userMessage}"

Devuelve ÚNICAMENTE el ID del agente elegido. Sin explicaciones.`;

        const result = await model.generateContent(routerPrompt);
        const selectedId = result.response.text().trim().replace(/[^a-z0-9-]/gi, "");
        const validAgent = activeAgents.find(a => a.id === selectedId);

        return runAIAgent({
            agentId: validAgent ? validAgent.id : activeAgents[0].id,
            companyId, userMessage, conversationId, contactData, inlineHistory
        });
    } catch {
        // Fallback to first agent on triage failure
        return runAIAgent({ agentId: activeAgents[0].id, companyId, userMessage, conversationId, contactData, inlineHistory });
    }
}
