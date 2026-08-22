export interface CrmContextData {
    lead?: {
        id?: string;
        name?: string;
        email?: string;
        phone?: string;
        companyName?: string;
        score?: number;
        status?: string;
        customFields?: Record<string, any>;
    };
    deal?: {
        id?: string;
        title?: string;
        amount?: number;
        currency?: string;
        stage?: string;
    };
    company?: {
        id?: string;
        name?: string;
        domain?: string;
    };
    user?: {
        name?: string;
        email?: string;
        role?: string;
    };
}
export declare class CrmVariableParserService {
    /**
     * Reemplaza variables estilo {{lead.name}}, {{lead.email}}, {{deal.amount}}, {{company.name}} en un texto o prompt
     */
    static parseVariables(templateText: string, contextData: CrmContextData): string;
    /**
     * Carga los datos reales del CRM desde Prisma dado el leadId o companyId
     */
    static loadContextFromDb(companyId: string, leadId?: string): Promise<CrmContextData>;
}
