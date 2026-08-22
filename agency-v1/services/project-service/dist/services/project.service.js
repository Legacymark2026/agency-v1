"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectService = void 0;
const database_1 = require("@agency/database");
class ProjectService {
    /**
     * Obtener proyectos Kanban
     */
    static async getProjects(companyId, status, page = 1, limit = 20) {
        const where = { companyId };
        if (status)
            where.status = status;
        const skip = (page - 1) * limit;
        const [projects, total] = await Promise.all([
            database_1.prisma.kanbanProject.findMany({
                where,
                orderBy: { updatedAt: "desc" },
                take: limit,
                skip,
                include: { swimlanes: true },
            }),
            database_1.prisma.kanbanProject.count({ where }),
        ]);
        return { projects, total, page, limit };
    }
    /**
     * Crear proyecto Kanban con swimlanes por defecto
     */
    static async createProject(input) {
        return database_1.prisma.$transaction(async (tx) => {
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
exports.ProjectService = ProjectService;
//# sourceMappingURL=project.service.js.map