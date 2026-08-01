export interface VariableContext {
    name?: string;
    email?: string;
    companyName?: string;
    discountCode?: string;
    unsubscribeLink?: string;
    [key: string]: any;
}
export declare class VariableParserService {
    private static DEFAULT_CONTEXT;
    /**
     * Parsear e interpolar variables dinámicas {{variable}} en cadenas de texto o marcado HTML
     */
    static parseVariables(templateText: string, context?: VariableContext): string;
    private static getNestedValue;
}
