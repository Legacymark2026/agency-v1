import { prisma } from "@agency/database";
import { EventBus } from "@agency/events";

export interface CreateProjectInput {
  companyId: string;
  name: string;
  description?: string;
  dealId?: string;
  leadId?: string;
}

export class ProjectService {
  /**
   * Obtener proyectos Kanban
   */
  static async getProjects(companyId: string, status?: string, page = 1, limit = 20) {
    const where: Record<string, unknown> = { companyId };
    if (status) where.status = status;

    const skip = (page - 1) * limit;

    const [projects, total] = await Promise.all([
      prisma.kanbanProject.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        take: limit,
        skip,
        include: { swimlanes: true },
      }),
      prisma.kanbanProject.count({ where }),
    ]);

    return { projects, total, page, limit };
  }

  /**
   * Crear proyecto Kanban con swimlanes por defecto
   */
  static async createProject(input: CreateProjectInput) {
    return prisma.$transaction(async (tx: any) => {
      const project = await tx.kanbanProject.create({
        data: {
          companyId: input.companyId,
          name: input.name,
          description: input.description,
          swimlanes: {
            create: [
              { name: "Por Hacer", color: "#6B7280", position: 0 },
              { name: "En Progreso", color: "#3B82F6", position: 1 },
              { name: "Revisión", color: "#F59E0B", position: 2 },
              { name: "Completado", color: "#10B981", position: 3 },
            ]
          }
        },
        include: { swimlanes: true }
      });

      return project;
    });
  }
}
