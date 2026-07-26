import { prisma } from "@agency/database";
import { EventBus } from "@agency/events";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const eventBus = new EventBus(REDIS_URL, "admin-service");

export class AdminService {
  /**
   * Obtener proyectos Kanban para el panel de administración
   */
  static async getAdminKanbanProjects(companyId: string) {
    return prisma.kanbanProject.findMany({
      where: { companyId },
      include: {
        kanbanTasks: {
          orderBy: { order: "asc" },
          include: { assignee: { select: { id: true, name: true, image: true } } }
        },
        swimlanes: { orderBy: { order: "asc" } }
      },
      orderBy: { createdAt: "desc" }
    });
  }

  /**
   * Obtener métricas globales del sistema
   */
  static async getSystemOverview() {
    const [companiesCount, usersCount] = await Promise.all([
      prisma.company.count(),
      prisma.user.count()
    ]);

    return { companiesCount, usersCount, status: "HEALTHY", timestamp: new Date().toISOString() };
  }
}
