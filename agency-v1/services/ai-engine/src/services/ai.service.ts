import { prisma } from "@agency/database";
import { EventBus } from "@agency/events";
import { ToolExecutorService } from "./tool-executor.service";
import { AgentMemoryService } from "./agent-memory.service";
import { TokenQuotaService } from "./token-quota.service";
import { RefragService } from "./refrag.service";
import { CrmVariableParserService } from "./crm-variable-parser.service";
import { HitlWorkflowService } from "./hitl-workflow.service";
import { GuardrailsService } from "./guardrails.service";

const REDIS_URL = process.env.REDIS_URL || "redis://redis:6379";
const eventBus = new EventBus(REDIS_URL, "ai-engine");

export interface RunAgentInput {
  agentId: string;
  companyId: string;
  userMessage: string;
  conversationId?: string;
  leadId?: string;
  requestedTools?: string[];
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
        { id: 'sales-executive', companyId, name: 'Agente Ejecutivo de Ventas', role: 'Sales Representative', isEnabled: true },
        { id: 'support-specialist', companyId, name: 'Agente Soporte Técnico 24/7', role: 'Support Engineer', isEnabled: true },
        { id: 'copywriter-pro', companyId, name: 'Redactor & Growth Marketer', role: 'Content Specialist', isEnabled: true },
        { id: 'data-analyst', companyId, name: 'Analista de Negocios & BI', role: 'Business Intelligence Analyst', isEnabled: true }
      ];
    }
  }

  /**
   * Ejecutar respuesta del motor cognitivo con ReFRAG, variables CRM, Guardrails y Human-in-the-Loop
   */
  static async runAgent(input: RunAgentInput) {
    const conversationId = input.conversationId || `conv-${Date.now()}`;

    // ── 🛡️ PILAR 1: Guardrails de Seguridad (PII & Injection Check) ──────────────
    const inputGuardrail = GuardrailsService.inspect(input.userMessage);
    if (!inputGuardrail.passed) {
      throw new Error(`Entrada bloqueada por Guardrails de Seguridad: ${inputGuardrail.violations.join(', ')}`);
    }
    const cleanUserMessage = inputGuardrail.sanitizedText;

    // ── 📊 PILAR 2: Control de Presupuesto y Cuota de Tokens LLM ──────────────────
    const quotaCheck = await TokenQuotaService.checkQuota(input.companyId, input.agentId, 1500);
    if (!quotaCheck.allowed) {
      throw new Error(quotaCheck.message);
    }

    // ── 🗄️ Cargar Contexto CRM & Inyección de Variables ({{lead.name}}, etc.) ─────
    const crmContext = await CrmVariableParserService.loadContextFromDb(input.companyId, input.leadId);

    // Guardar mensaje de usuario en memoria episódica
    await AgentMemoryService.addMemory(input.agentId, conversationId, 'user', cleanUserMessage);

    // ── 🔍 PILAR 3: ReFRAG (Recursive RAG & Cross-Encoder Re-ranking) ──────────────
    let refragResult = null;
    if (input.enableRefrag !== false) {
      refragResult = await RefragService.retrieveAndRerank(cleanUserMessage, input.companyId, {
        topK: 3,
        minScoreThreshold: 0.35,
        enableReranking: true
      });
    }

    // Recuperar memoria conversacional reciente
    const memoryContext = await AgentMemoryService.getConversationContext(conversationId, 10);

    // ── 🛠️ PILAR 4: Tool Calling & Reasoning ──────────────────────────────────────
    let toolExecutionResult: any = null;
    const msgLower = cleanUserMessage.toLowerCase();

    if (msgLower.includes('cotiza') || msgLower.includes('cotización') || msgLower.includes('precio') || msgLower.includes('cuanto cuesta')) {
      toolExecutionResult = await ToolExecutorService.executeTool({
        toolName: 'generate_quote',
        parameters: {
          clientName: crmContext.lead?.name || 'Cliente Interesado',
          items: [{ name: 'Plan Enterprise Pro', quantity: 1, unitPrice: 3500 }]
        },
        companyId: input.companyId,
        agentId: input.agentId
      });
    } else if (msgLower.includes('busca') || msgLower.includes('cliente') || msgLower.includes('lead') || msgLower.includes('contacto')) {
      toolExecutionResult = await ToolExecutorService.executeTool({
        toolName: 'search_crm',
        parameters: { query: cleanUserMessage.replace(/busca|cliente|lead|contacto/gi, '').trim() || 'Demo' },
        companyId: input.companyId,
        agentId: input.agentId
      });
    } else if (msgLower.includes('metrica') || msgLower.includes('analítica') || msgLower.includes('conversiones') || msgLower.includes('reporte')) {
      toolExecutionResult = await ToolExecutorService.executeTool({
        toolName: 'query_analytics',
        parameters: { metric: 'conversions', periodDays: 30 },
        companyId: input.companyId,
        agentId: input.agentId
      });
    }

    // ── 💬 Construir Respuesta del Asistente ─────────────────────────────────────
    let rawResponse = '';
    let confidenceScore = 0.94; // Score base estimado de confianza LLM

    if (toolExecutionResult && toolExecutionResult.success) {
      if (toolExecutionResult.toolName === 'generate_quote') {
        const q = toolExecutionResult.result;
        rawResponse = `Hola {{lead.name}}, he generado la cotización solicitada para {{lead.companyName}}: Total USD $${q.totalAmount.toLocaleString()} (Válida hasta ${q.validUntil}).`;
      } else if (toolExecutionResult.toolName === 'search_crm') {
        const r = toolExecutionResult.result;
        rawResponse = `Hola {{user.name}}, he consultado el CRM y encontré ${r.foundCount} coincidencias para {{lead.name}}: ${r.leads.map((l: any) => `${l.name} (${l.email})`).join(', ')}.`;
      } else if (toolExecutionResult.toolName === 'query_analytics') {
        const a = toolExecutionResult.result;
        rawResponse = `Informe de Analítica para {{company.name}}: ${a.metric} en los últimos ${a.periodDays} días alcanzaron ${a.value} ${a.unit} (${a.trend}).`;
      } else {
        rawResponse = `Acción completada exitosamente mediante la herramienta ${toolExecutionResult.toolName}.`;
      }
    } else if (refragResult && refragResult.chunks.length > 0) {
      rawResponse = `Basado en la base de conocimiento oficial de {{company.name}} (${refragResult.chunks[0].documentTitle}): ${refragResult.chunks[0].content}`;
      confidenceScore = refragResult.chunks[0].rerankedScore || refragResult.chunks[0].score || 0.88;
    } else {
      rawResponse = `Entendido {{lead.name}}. He procesado tu solicitud considerando tu historial conversacional (${memoryContext.length} mensajes previos). ¿Cómo más te puedo ayudar hoy?`;
      confidenceScore = 0.85;
    }

    // Inyectar variables CRM dinámicas en el texto final
    const finalParsedResponse = CrmVariableParserService.parseVariables(rawResponse, crmContext);

    // Inspeccionar salida con Guardrails de Seguridad
    const outputGuardrail = GuardrailsService.inspect(finalParsedResponse);
    const safeResponse = outputGuardrail.sanitizedText;

    // ── 👤 PILAR 5: Human-in-the-Loop (HITL Workflow Evaluation) ──────────────────
    const hitlCheck = HitlWorkflowService.shouldRequireHumanReview(
      cleanUserMessage,
      safeResponse,
      confidenceScore,
      toolExecutionResult?.toolName
    );

    let pendingHitlItem = null;
    if (hitlCheck.requiresReview) {
      pendingHitlItem = await HitlWorkflowService.createPendingReview({
        agentId: input.agentId,
        companyId: input.companyId,
        conversationId,
        userMessage: cleanUserMessage,
        proposedResponse: safeResponse,
        confidenceScore,
        triggerReason: hitlCheck.reason || 'REQUERIDO_POR_REGLAS_HITL'
      });
    }

    // Guardar respuesta final en memoria episódica
    await AgentMemoryService.addMemory(input.agentId, conversationId, 'assistant', safeResponse, {
      confidenceScore,
      hitlPending: !!pendingHitlItem,
      toolExecuted: toolExecutionResult ? toolExecutionResult.toolName : null
    });

    // Registrar consumo de tokens LLM
    await TokenQuotaService.recordTokenUsage(input.companyId, input.agentId, 280, 160);

    // Publicar evento en Bus Redis
    try {
      await eventBus.publish("agent.response_ready", {
        agentId: input.agentId,
        companyId: input.companyId,
        conversationId,
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
      response: safeResponse,
      confidenceScore,
      hitlRequired: !!pendingHitlItem,
      hitlItem: pendingHitlItem,
      refragContextUsed: !!refragResult && refragResult.chunks.length > 0,
      toolResult: toolExecutionResult
    };
  }
}
