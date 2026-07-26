import { prisma } from "@agency/database";
import { EventBus } from "@agency/events";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const eventBus = new EventBus(REDIS_URL, "agent-team-engine");

export class AgentTeamService {
  /**
   * Obtener equipos de agentes configurados por empresa
   */
  static async getTeams(companyId: string) {
    return (prisma as any).agentTeam.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" }
    });
  }
}
