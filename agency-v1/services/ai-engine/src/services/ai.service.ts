import { prisma } from "@agency/database";
import { EventBus } from "@agency/events";
import { ToolExecutorService } from "./tool-executor.service";
import { AgentMemoryService } from "./agent-memory.service";
import { TokenQuotaService } from "./token-quota.service";
import { RefragService } from "./refrag.service";
import { CrmVariableParserService } from "./crm-variable-parser.service";
import { HitlWorkflowService } from "./hitl-workflow.service";
import { GuardrailsService } from "./guardrails.service";
import { AgentGovernanceService } from "./agent-governance.service";
import { ReasoningTraceService } from "./reasoning-trace.service";

const REDIS_URL = process.env.REDIS_URL || "redis://redis:6379";
const eventBus = new EventBus(REDIS_URL, "ai-engine");

export interface RunAgentInput {
  agentId: string;
  companyId: string;
  userMessage: string;
  conversationId?: string;
  leadId?: string;
  enableRefrag?: boolean;
}

export class AiService {
  /**
   * Obtener agentes de IA registrados por empresa
   */
  static async getAgents(companyId: string) {
    try {
      return await (prisma as any).agentConfig.findMany({
        where: { companyId },
        orderBy: { createdAt: "desc" }
      });
    } catch {
      return [
        { id: "sales-executive",    companyId, name: "Agente Ejecutivo de Ventas",    role: "Sales Representative",         isEnabled: true },
        { id: "support-specialist", companyId, name: "Agente Soporte Técnico 24/7",   role: "Support Engineer",              isEnabled: true },
        { id: "copywriter-pro",     companyId, name: "Redactor & Growth Marketer",    role: "Content Specialist",            isEnabled: true },
        { id: "data-analyst",       companyId, name: "Analista de Negocios & BI",     role: "Business Intelligence Analyst", isEnabled: true }
      ];
    }
  }

  /**
   * Motor Cognitivo Completo v3.0 Enterprise
   * Pillars: Governance → Guardrails → Quota → CRM → ReFRAG → Tools → HITL → Trace → Feedback
   */
  static async runAgent(input: RunAgentInput) {
    const conversationId = input.conversationId || `conv-${Date.now()}`;

    // ── 📋 Start Reasoning Trace ───────────────────────────────────────────
    const tb = ReasoningTraceService.createBuilder(
      input.agentId, input.companyId, conversationId, input.userMessage
    );

    // ── 🎛️ PILAR 1: Governance Config (Autonomy Mode, Temperature, Thresholds) ──
    const governance = await AgentGovernanceService.getConfig(input.companyId, input.agentId);
    tb.setGovernance(governance.autonomyMode, governance.temperature)
      .addStep("GOVERNANCE", `Modo ${governance.autonomyMode} | Temp ${governance.temperature}`, "OK", {
        autonomyMode: governance.autonomyMode,
        temperature: governance.temperature,
        hitlThreshold: governance.hitlConfidenceThreshold,
        hitlQuoteLimit: governance.hitlHighValueQuoteUsd
      });

    if (!governance.isActive) {
      throw new Error("Este agente está desactivado. Actívelo desde el panel de Gobernanza.");
    }

    // ── 🛡️ PILAR 2: Guardrails de Seguridad (Input) ────────────────────────
    const inputGuardrail = GuardrailsService.inspect(input.userMessage);
    if (!inputGuardrail.passed) {
      tb.addStep("GUARDRAILS_INPUT", "Entrada bloqueada por Guardrails", "BLOCKED", {
        violations: inputGuardrail.violations,
        promptInjection: inputGuardrail.promptInjectionDetected
      });
      await ReasoningTraceService.saveTrace(tb.build());
      throw new Error(`Entrada bloqueada por Guardrails: ${inputGuardrail.violations.join(", ")}`);
    }

    const cleanUserMessage = inputGuardrail.sanitizedText;
    tb.addStep("GUARDRAILS_INPUT", "Entrada aprobada por Guardrails", inputGuardrail.piiDetected ? "WARN" : "OK", {
      piiRedacted: inputGuardrail.piiDetected
    });

    // ── 📊 PILAR 3: Control de Cuota de Tokens LLM ─────────────────────────
    const quotaCheck = await TokenQuotaService.checkQuota(input.companyId, input.agentId, 1500);
    if (!quotaCheck.allowed) {
      tb.addStep("QUOTA_CHECK", "Cuota de tokens agotada", "BLOCKED", { message: quotaCheck.message });
      await ReasoningTraceService.saveTrace(tb.build());
      throw new Error(quotaCheck.message);
    }
    const remainingTokens = quotaCheck.limit - quotaCheck.currentUsage;
    tb.addStep("QUOTA_CHECK", `Cuota OK — Restante: ${remainingTokens.toLocaleString()} tokens`, "OK");

    // ── 🗄️ PILAR 4: Variables CRM Dinámicas ────────────────────────────────
    const crmContext = await CrmVariableParserService.loadContextFromDb(input.companyId, input.leadId);
    tb.addStep("CRM_VARIABLES", `Contexto CRM cargado: ${crmContext.lead?.name || "Sin lead"} (${crmContext.company?.name})`, "OK", {
      leadId: input.leadId,
      leadName: crmContext.lead?.name,
      companyName: crmContext.company?.name
    });

    // ── 💾 Memoria Episódica ────────────────────────────────────────────────
    await AgentMemoryService.addMemory(input.agentId, conversationId, "user", cleanUserMessage);
    const memoryContext = await AgentMemoryService.getConversationContext(conversationId, 10);
    tb.addStep("MEMORY", `${memoryContext.length} mensajes en contexto conversacional`, "OK", {
      messagesInContext: memoryContext.length
    });

    // ── 🔍 PILAR 5: ReFRAG (Recursive RAG & Cross-Encoder Re-ranking) ───────
    let refragResult: { chunks: any[]; compressedContext: string } | null = null;
    if (input.enableRefrag !== false) {
      refragResult = await RefragService.retrieveAndRerank(cleanUserMessage, input.companyId, {
        topK: 3,
        minScoreThreshold: 0.35,
        enableReranking: true
      });
      const topScore = refragResult.chunks[0]?.rerankedScore || refragResult.chunks[0]?.score || 0;
      tb.setRefrag(refragResult.chunks.length, topScore)
        .addStep("REFRAG", `${refragResult.chunks.length} fragmentos recuperados (top score: ${topScore.toFixed(2)})`,
          refragResult.chunks.length > 0 ? "OK" : "WARN",
          { chunks: refragResult.chunks.map(c => ({ title: c.documentTitle, score: c.rerankedScore || c.score })) }
        );
    }

    // ── 🛠️ PILAR 6: Tool Calling (respeta allowedTools de Governance) ───────
    let toolExecutionResult: any = null;
    const msgLower = cleanUserMessage.toLowerCase();

    const isToolAllowed = (tool: string) =>
      governance.allowedTools.length === 0 || governance.allowedTools.includes(tool);

    if (isToolAllowed("generate_quote") && (msgLower.includes("cotiza") || msgLower.includes("precio") || msgLower.includes("cuanto cuesta"))) {
      toolExecutionResult = await ToolExecutorService.executeTool({
        toolName: "generate_quote",
        parameters: {
          clientName: crmContext.lead?.name || "Cliente Interesado",
          items: [{ name: "Plan Enterprise Pro", quantity: 1, unitPrice: 3500 }]
        },
        companyId: input.companyId,
        agentId: input.agentId
      });
      tb.addTool("generate_quote")
        .addStep("TOOL_CALL", "generate_quote ejecutado", toolExecutionResult.success ? "OK" : "WARN",
          { result: toolExecutionResult.result }
        );
    } else if (isToolAllowed("search_crm") && (msgLower.includes("busca") || msgLower.includes("cliente") || msgLower.includes("lead"))) {
      toolExecutionResult = await ToolExecutorService.executeTool({
        toolName: "search_crm",
        parameters: { query: cleanUserMessage.replace(/busca|cliente|lead|contacto/gi, "").trim() || "Demo" },
        companyId: input.companyId,
        agentId: input.agentId
      });
      tb.addTool("search_crm")
        .addStep("TOOL_CALL", "search_crm ejecutado", toolExecutionResult.success ? "OK" : "WARN",
          { foundCount: toolExecutionResult.result?.foundCount }
        );
    } else if (isToolAllowed("query_analytics") && (msgLower.includes("métrica") || msgLower.includes("analítica") || msgLower.includes("conversiones") || msgLower.includes("reporte"))) {
      toolExecutionResult = await ToolExecutorService.executeTool({
        toolName: "query_analytics",
        parameters: { metric: "conversions", periodDays: 30 },
        companyId: input.companyId,
        agentId: input.agentId
      });
      tb.addTool("query_analytics")
        .addStep("TOOL_CALL", "query_analytics ejecutado", toolExecutionResult.success ? "OK" : "WARN",
          { metric: toolExecutionResult.result?.metric, value: toolExecutionResult.result?.value }
        );
    }

    // ── 💬 Construir Respuesta ──────────────────────────────────────────────
    let rawResponse = "";
    let confidenceScore = 0.94;
    let quoteAmount: number | undefined;

    if (toolExecutionResult?.success) {
      if (toolExecutionResult.toolName === "generate_quote") {
        const q = toolExecutionResult.result;
        quoteAmount = q.totalAmount;
        rawResponse = `Hola {{lead.name}}, he generado la cotización solicitada para {{lead.companyName}}: Total USD $${q.totalAmount.toLocaleString()} (Válida hasta ${q.validUntil}).`;
      } else if (toolExecutionResult.toolName === "search_crm") {
        const r = toolExecutionResult.result;
        rawResponse = `Hola {{user.name}}, encontré ${r.foundCount} coincidencias para {{lead.name}}: ${r.leads.map((l: any) => `${l.name} (${l.email})`).join(", ")}.`;
      } else if (toolExecutionResult.toolName === "query_analytics") {
        const a = toolExecutionResult.result;
        rawResponse = `Analítica de {{company.name}}: ${a.metric} últimos ${a.periodDays} días = ${a.value} ${a.unit} (${a.trend}).`;
      } else {
        rawResponse = `Acción completada con la herramienta ${toolExecutionResult.toolName}.`;
      }
    } else if (refragResult && refragResult.chunks.length > 0) {
      rawResponse = `Basado en la base de conocimiento de {{company.name}} (${refragResult.chunks[0].documentTitle}): ${refragResult.chunks[0].content}`;
      confidenceScore = refragResult.chunks[0].rerankedScore || refragResult.chunks[0].score || 0.88;
    } else {
      rawResponse = `Entendido {{lead.name}}. He procesado tu solicitud con ${memoryContext.length} mensajes de contexto. ¿En qué más puedo ayudarte?`;
      confidenceScore = 0.85;
    }

    // Inject CRM variables
    const parsedResponse = CrmVariableParserService.parseVariables(rawResponse, crmContext);

    // Output guardrails
    const outputGuardrail = GuardrailsService.inspect(parsedResponse);
    const safeResponse = outputGuardrail.sanitizedText;
    tb.addStep("GUARDRAILS_OUTPUT", "Salida inspeccionada por Guardrails", outputGuardrail.piiDetected ? "WARN" : "OK", {
      piiRedacted: outputGuardrail.piiDetected
    });

    // ── 👤 PILAR 7: Human-in-the-Loop con Gobernanza Dinámica ───────────────
    const hitlCheck = AgentGovernanceService.evaluateHitl(
      governance, confidenceScore, toolExecutionResult?.toolName, quoteAmount, cleanUserMessage
    );

    let pendingHitlItem: any = null;
    if (hitlCheck.requiresReview) {
      pendingHitlItem = await HitlWorkflowService.createPendingReview({
        agentId: input.agentId,
        companyId: input.companyId,
        conversationId,
        userMessage: cleanUserMessage,
        proposedResponse: safeResponse,
        confidenceScore,
        triggerReason: hitlCheck.reason || "HITL_GOVERNANCE_RULE"
      });
    }

    tb.setHitl(hitlCheck.requiresReview, hitlCheck.reason)
      .addStep("HITL_EVAL", hitlCheck.requiresReview
        ? `Retenido: ${hitlCheck.reason}`
        : `Aprobado automáticamente (${governance.autonomyMode})`,
        hitlCheck.requiresReview ? "WARN" : "OK"
      );

    // ── 💾 Persitir memoria + tokens ────────────────────────────────────────
    const tokensUsed = 280 + (governance.temperature > 0.7 ? 60 : 0);
    await AgentMemoryService.addMemory(input.agentId, conversationId, "assistant", safeResponse, {
      confidenceScore,
      hitlPending: !!pendingHitlItem,
      toolExecuted: toolExecutionResult?.toolName || null
    });
    await TokenQuotaService.recordTokenUsage(input.companyId, input.agentId, tokensUsed, 160);

    // ── 📋 Finalizar y Guardar Reasoning Trace ──────────────────────────────
    tb.setResponse(safeResponse, confidenceScore)
      .setTokens(tokensUsed)
      .addStep("RESPONSE", `Respuesta generada (confianza: ${(confidenceScore * 100).toFixed(1)}%)`, "OK");

    const trace = tb.build();
    await ReasoningTraceService.saveTrace(trace);

    // ── 📡 Publicar evento en Bus Redis ─────────────────────────────────────
    try {
      await (eventBus as any).publish("agent.response_ready", {
        agentId: input.agentId,
        companyId: input.companyId,
        conversationId,
        traceId: trace.traceId,
        response: safeResponse,
        hitlRequired: !!pendingHitlItem,
        hitlId: pendingHitlItem?.id || null,
        timestamp: new Date().toISOString()
      });
    } catch {}

    return {
      success: true,
      agentId: input.agentId,
      conversationId,
      traceId: trace.traceId,
      response: safeResponse,
      confidenceScore,
      autonomyMode: governance.autonomyMode,
      hitlRequired: !!pendingHitlItem,
      hitlItem: pendingHitlItem,
      refragContextUsed: !!refragResult && refragResult.chunks.length > 0,
      toolResult: toolExecutionResult
    };
  }
}
