export declare class AdminService {
    /**
     * Obtener proyectos Kanban para el panel de administración
     */
    static getAdminKanbanProjects(companyId: string): Promise<any>;
    /**
     * Obtener métricas globales del sistema
     */
    static getSystemOverview(): Promise<{
        companiesCount: any;
        usersCount: any;
        status: string;
        timestamp: string;
    }>;
}
