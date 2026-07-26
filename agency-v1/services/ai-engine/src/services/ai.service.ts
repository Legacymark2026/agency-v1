import { prisma } from "@agency/database";
import { EventBus } from "@agency/events";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const eventBus = new EventBus(REDIS_URL, "ai-engine");

export interface RunAgentInput {
  agentId: string;
  companyId: string;
  userMessage: string;
  conversationId?: string;
}

export class AiService {
  /**
   * Obtener agentes de IA registrados por empresa
   */
  static async getAgents(companyId: string) {
    return prisma.agent.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" }
    });
  }

  /**
   * Ejecutar respuesta de agente de IA y emitir evento
   */
  static async runAgent(input: RunAgentInput) {
    const responseText = `AI Agent response to: ${input.userMessage}`;

    await eventBus.publish("agent.response_ready", {
      agentId: input.agentId,
      companyId: input.companyId,
      conversationId: input.conversationId || "conv-default",
      response: responseText,
      timestamp: new Date().toISOString()
    });

    return { success: true, response: responseText, agentId: input.agentId };
  }
}
