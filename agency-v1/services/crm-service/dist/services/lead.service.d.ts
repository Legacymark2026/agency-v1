export interface GetLeadsFilter {
    companyId: string;
    status?: string;
    source?: string;
    scoreMin?: number;
    scoreMax?: number;
    search?: string;
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    syncDealId?: string;
    syncEmail?: string;
}
export interface CreateLeadInput {
    companyId: string;
    name: string;
    email: string;
    phone?: string;
    company?: string;
    source?: string;
    notes?: string;
    score?: number;
}
export declare class LeadService {
    /**
     * Obtiene la lista de leads con filtros paginados
     */
    static getLeads(filter: GetLeadsFilter): Promise<{
        leads: any;
        pagination: {
            total: any;
            page: number;
            pageSize: number;
            totalPages: number;
        };
    }>;
    /**
     * Obtiene un lead específico por su ID y companyId
     */
    static getLeadById(id: string, companyId: string): Promise<any>;
    /**
     * Crea un nuevo lead ejecutando asignación de agente y transacción atómica de Outbox
     */
    static createLead(input: CreateLeadInput): Promise<any>;
}
