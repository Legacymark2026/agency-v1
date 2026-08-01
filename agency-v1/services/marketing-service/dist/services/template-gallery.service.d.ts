export declare class TemplateGalleryService {
    /**
     * Obtiene la lista de plantillas disponibles (sistema y personalizadas)
     */
    static getTemplates(companyId?: string, category?: string): Promise<{
        id: string;
        name: string;
        category: string;
        description: string;
        thumbnail: string;
        isSystem: boolean;
        html: string;
    }[]>;
    /**
     * Obtiene una plantilla específica
     */
    static getTemplate(templateId: string): Promise<any>;
    /**
     * Crea una plantilla personalizada
     */
    static createTemplate(companyId: string, data: any): Promise<any>;
    /**
     * Clona una plantilla existente
     */
    static cloneTemplate(templateId: string, companyId: string): Promise<any>;
    /**
     * Retorna las categorías disponibles
     */
    static getCategories(): Promise<string[]>;
    /**
     * Retorna plantillas profesionales de sistema con HTML responsivo y moderno
     */
    static getSystemTemplates(): {
        id: string;
        name: string;
        category: string;
        description: string;
        thumbnail: string;
        isSystem: boolean;
        html: string;
    }[];
}
