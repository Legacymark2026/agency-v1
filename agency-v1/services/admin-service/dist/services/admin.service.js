"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const database_1 = require("@agency/database");
const events_1 = require("@agency/events");
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const eventBus = new events_1.EventBus(REDIS_URL, "admin-service");
class AdminService {
    /**
     * Obtener proyectos Kanban para el panel de administración
     */
    static async getAdminKanbanProjects(companyId) {
        return database_1.prisma.kanbanProject.findMany({
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
            database_1.prisma.company.count(),
            database_1.prisma.user.count()
        ]);
        return { companiesCount, usersCount, status: "HEALTHY", timestamp: new Date().toISOString() };
    }
}
exports.AdminService = AdminService;
//# sourceMappingURL=admin.service.js.map