export interface ToolExecutionInput {
    toolName: string;
    parameters: Record<string, any>;
    companyId: string;
    agentId: string;
}
export interface ToolExecutionResult {
    success: boolean;
    toolName: string;
    result: any;
    executionTimeMs: number;
    error?: string;
}
export declare class ToolExecutorService {
    /**
     * Lista de herramientas registradas disponibles para los agentes de IA
     */
    static getAvailableTools(): ({
        name: string;
        description: string;
        parameters: {
            query: {
                type: string;
                description: string;
            };
            entityType: {
                type: string;
                enum: string[];
                default: string;
            };
            recipientEmail?: undefined;
            subject?: undefined;
            bodyHtml?: undefined;
            clientName?: undefined;
            items?: undefined;
            discountPercent?: undefined;
            metric?: undefined;
            periodDays?: undefined;
        };
    } | {
        name: string;
        description: string;
        parameters: {
            recipientEmail: {
                type: string;
                description: string;
            };
            subject: {
                type: string;
                description: string;
            };
            bodyHtml: {
                type: string;
                description: string;
            };
            query?: undefined;
            entityType?: undefined;
            clientName?: undefined;
            items?: undefined;
            discountPercent?: undefined;
            metric?: undefined;
            periodDays?: undefined;
        };
    } | {
        name: string;
        description: string;
        parameters: {
            clientName: {
                type: string;
                description: string;
            };
            items: {
                type: string;
                description: string;
            };
            discountPercent: {
                type: string;
                description: string;
            };
            query?: undefined;
            entityType?: undefined;
            recipientEmail?: undefined;
            subject?: undefined;
            bodyHtml?: undefined;
            metric?: undefined;
            periodDays?: undefined;
        };
    } | {
        name: string;
        description: string;
        parameters: {
            metric: {
                type: string;
                enum: string[];
            };
            periodDays: {
                type: string;
                default: number;
            };
            query?: undefined;
            entityType?: undefined;
            recipientEmail?: undefined;
            subject?: undefined;
            bodyHtml?: undefined;
            clientName?: undefined;
            items?: undefined;
            discountPercent?: undefined;
        };
    })[];
    /**
     * Ejecuta la herramienta solicitada por el agente de forma segura
     */
    static executeTool(input: ToolExecutionInput): Promise<ToolExecutionResult>;
}
