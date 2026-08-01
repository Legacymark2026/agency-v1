export interface ConditionRule {
    field: string;
    operator: "equals" | "not_equals" | "contains" | "greater_than" | "less_than";
    value: any;
}
export declare class ConditionalContentService {
    /**
     * Evaluar si un bloque con regla showIf debe ser visible para un usuario
     */
    static shouldShowBlock(rule?: ConditionRule, recipientContext?: Record<string, any>): boolean;
    /**
     * Filtrar bloques de una plantilla basándose en el perfil del destinatario
     */
    static filterBlocksForRecipient(blocks: any[], recipientContext?: Record<string, any>): any[];
}
