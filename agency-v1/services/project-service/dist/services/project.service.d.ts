export interface CreateProjectInput {
    companyId: string;
    name: string;
    description?: string;
    dealId?: string;
    leadId?: string;
}
export declare class ProjectService {
    /**
     * Obtener proyectos Kanban
     */
    static getProjects(companyId: string, status?: string, page?: number, limit?: number): Promise<{
        projects: any;
        total: any;
        page: number;
        limit: number;
    }>;
    /**
     * Crear proyecto Kanban con swimlanes por defecto
     */
    static createProject(input: CreateProjectInput): Promise<any>;
}
