export interface CreateRenderJobInput {
    companyId: string;
    projectId?: string;
    templateId?: string;
    outputFormat?: string;
    resolution?: string;
}
export declare class VideoService {
    /**
     * Obtener proyectos o trabajos de video por empresa
     */
    static getVideoProjects(companyId: string): Promise<any>;
    /**
     * Crear trabajo de renderizado de video con transacción atómica
     */
    static createRenderJob(input: CreateRenderJobInput): Promise<any>;
}
