/**
 * Templates helper (P1 #6)
 *
 * Support for rendering Handlebars templates
 */
/**
 * Compila y renderiza template con contexto
 */
export declare function renderTemplate(template: string, context: Record<string, any>): string;
/**
 * Valida syntax de template antes de guardar
 */
export declare function validateTemplateSync(template: string): {
    isValid: boolean;
    errors: string[];
};
/**
 * Registra helpers customizados
 */
export declare function registerTemplateHelpers(): void;
/**
 * Contexto template pre-definido para inbox macros
 */
export declare function buildMacroTemplateContext(data: {
    lead?: any;
    deal?: any;
    conversation?: any;
    user?: any;
    company?: any;
}): {
    lead: {
        name: any;
        email: any;
        phone: any;
        company: any;
    };
    deal: {
        id: any;
        title: any;
        value: any;
        stage: any;
    };
    conversation: {
        id: any;
        channel: any;
        status: any;
    };
    user: {
        name: any;
        email: any;
        phone: any;
    };
    company: {
        name: any;
        website: any;
    };
    date: Date;
    now: Date;
};
