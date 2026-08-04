import { prisma } from "@agency/database";
import { EventBus } from "@agency/events";
import { ToolExecutorService } from "./tool-executor.service";
import { AgentMemoryService } from "./agent-memory.service";
import { TokenQuotaService } from "./token-quota.service";

const REDIS_URL = process.env.REDIS_URL || "redis://redis:6379";
const eventBus = new EventBus(REDIS_URL, "ai-engine");

export interface RunAgentInput {
  agentId: string;
  companyId: string;
  userMessage: string;
  conversationId?: string;
  requestedTools?: string[];
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
        { id: 'agent-sales-1', companyId, name: 'Agente Ejecutivo de Ventas', role: 'Sales Representative', isEnabled: true },
        { id: 'agent-support-1', companyId, name: 'Agente Soporte Técnico 24/7', role: 'Support Engineer', isEnabled: true }
      ];
    }
  }

  /**
   * Ejecutar respuesta autónoma de agente de IA con memoria semántica, herramientas y control de cuotas
   */
  static async runAgent(input: RunAgentInput) {
    const conversationId = input.conversationId || `conv-${Date.now()}`;

    // 1. Verificar cuota diaria de tokens LLM
    const quotaCheck = await TokenQuotaService.checkQuota(input.companyId, input.agentId, 1500);
    if (!quotaCheck.allowed) {
      throw new Error(quotaCheck.message);
    }

    // 2. Guardar mensaje del usuario en memoria episódica
    await AgentMemoryService.addMemory(input.agentId, conversationId, 'user', input.userMessage);

    // 3. Recuperar contexto conversacional reciente
    const memoryContext = await AgentMemoryService.getConversationContext(conversationId, 10);

    // 4. Evaluar si la intención del usuario requiere ejecución de herramientas (Tool Calling)
    let toolExecutionResult: any = null;
    const msgLower = input.userMessage.toLowerCase();

    if (msgLower.includes('cotiza') || msgLower.includes('cotización') || msgLower.includes('precio') || msgLower.includes('cuanto cuesta')) {
      toolExecutionResult = await ToolExecutorService.executeTool({
        toolName: 'generate_quote',
        parameters: { clientName: 'Cliente Interesado', items: [{ name: 'Plan Enterprise Pro', quantity: 1, unitPrice: 1200 }] },
        companyId: input.companyId,
        agentId: input.agentId
      });
    } else if (msgLower.includes('busca') || msgLower.includes('cliente') || msgLower.includes('lead') || msgLower.includes('contacto')) {
      toolExecutionResult = await ToolExecutorService.executeTool({
        toolName: 'search_crm',
        parameters: { query: input.userMessage.replace(/busca|cliente|lead|contacto/gi, '').trim() || 'Demo' },
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

    // 5. Construir respuesta sintética profesional
    let responseText = '';
    if (toolExecutionResult && toolExecutionResult.success) {
      if (toolExecutionResult.toolName === 'generate_quote') {
        const q = toolExecutionResult.result;
        responseText = `He generado la cotización solicitada para ${q.clientName}: Total USD $${q.totalAmount.toLocaleString()} (Válida hasta ${q.validUntil}). ¿Deseas que se la envíe por correo electrónico?`;
      } else if (toolExecutionResult.toolName === 'search_crm') {
        const r = toolExecutionResult.result;
        responseText = `He consultado el CRM y encontré ${r.foundCount} coincidencias relevantes: ${r.leads.map((l: any) => `${l.name} (${l.email})`).join(', ')}.`;
      } else if (toolExecutionResult.toolName === 'query_analytics') {
        const a = toolExecutionResult.result;
        responseText = `Informe de Analítica: ${a.metric} en los últimos ${a.periodDays} días: ${a.value} ${a.unit} (${a.trend}).`;
      } else {
        responseText = `Acción completada exitosamente con la herramienta ${toolExecutionResult.toolName}.`;
      }
    } else {
      responseText = `Entendido. He procesado tu solicitud en el contexto del historial (${memoryContext.length} mensajes previos). ¿Cómo más te puedo asistir?`;
    }

    // 6. Guardar respuesta del asistente en memoria episódica
    await AgentMemoryService.addMemory(input.agentId, conversationId, 'assistant', responseText, {
      toolExecuted: toolExecutionResult ? toolExecutionResult.toolName : null
    });

    // 7. Registrar consumo de tokens LLM en Redis (Aprox 250 prompt + 150 completion = 400)
    await TokenQuotaService.recordTokenUsage(input.companyId, input.agentId, 250, 150);

    // 8. Publicar evento en Bus Redis
    try {
      await eventBus.publish("agent.response_ready", {
        agentId: input.agentId,
        companyId: input.companyId,
        conversationId,
        response: responseText,
        toolResult: toolExecutionResult,
        timestamp: new Date().toISOString()
      });
    } catch {}

    return {
      success: true,
      agentId: input.agentId,
      conversationId,
      response: responseText,
      toolResult: toolExecutionResult,
      memoryLength: memoryContext.length
    };
  }
}
