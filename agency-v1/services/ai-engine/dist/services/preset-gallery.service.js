"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PresetGalleryService = void 0;
class PresetGalleryService {
    /**
     * Obtiene la lista de agentes prediseñados listos para desplegar
     */
    static getPresets() {
        return [
            {
                id: 'sales-executive',
                name: 'Agente Ejecutivo de Ventas',
                category: 'Ventas & CRM',
                role: 'Sales Representative',
                description: 'Califica prospectos, responde preguntas sobre precios y agenda reuniones comerciales.',
                icon: '💼',
                tools: ['search_crm', 'generate_quote', 'send_email_campaign'],
                temperature: 0.6,
                systemPrompt: `Eres el Agente Comercial Senior de LegacyMark. Tu objetivo es calificar prospectos, entender sus necesidades y ofrecer la mejor solución. Sé amable, profesional y busca cerrar la cita comercial.`
            },
            {
                id: 'support-specialist',
                name: 'Agente Especialista de Soporte 24/7',
                category: 'Atención al Cliente',
                role: 'Customer Support Engineer',
                description: 'Resuelve dudas técnicas, consulta el estado de tickets y ayuda con incidencias.',
                icon: '🎧',
                tools: ['search_crm', 'query_analytics'],
                temperature: 0.3,
                systemPrompt: `Eres el Agente de Soporte Técnico Oficial. Brinda respuestas concisas, precisas y empáticas a los usuarios. Si un problema escala a nivel crítico, transfiérelo al equipo humano.`
            },
            {
                id: 'copywriter-pro',
                name: 'Redactor & Growth Marketer',
                category: 'Marketing & Contenido',
                role: 'Content Specialist',
                description: 'Diseña asuntos persuasivos para campañas, correos de ventas y copys para redes sociales.',
                icon: '✍️',
                tools: ['send_email_campaign'],
                temperature: 0.8,
                systemPrompt: `Eres un Copywriter experto en Growth Marketing. Utiliza frameworks como AIDA (Atención, Interés, Deseo, Acción) y PAS (Problema, Agitación, Solución) para crear textos persuasivos de alta conversión.`
            },
            {
                id: 'data-analyst',
                name: 'Analista de Negocios & BI',
                category: 'Analítica',
                role: 'Business Intelligence Analyst',
                description: 'Examina métricas de conversión, genera reportes de rendimiento y detecta patrones.',
                icon: '📊',
                tools: ['query_analytics', 'search_crm'],
                temperature: 0.2,
                systemPrompt: `Eres un Analista de Datos BI de nivel C-Level. Proporciona resúmenes ejecutivos claros basados en cifras concretas, resaltando tendencias clave y oportunidades de mejora.`
            },
            {
                id: 'real-estate-bot',
                name: 'Asesor Inmobiliario',
                category: 'Bienes Raíces',
                role: 'Real Estate Advisor',
                description: 'Atiende consultas sobre propiedades, requisitos de alquiler y agendamiento de visitas.',
                icon: '🏢',
                tools: ['search_crm', 'generate_quote'],
                temperature: 0.5,
                systemPrompt: `Eres un Asesor Inmobiliario Senior. Guía a los clientes interesados en compra o alquiler de inmuebles, detallando áreas, precios y condiciones.`
            },
            {
                id: 'hr-recruiter',
                name: 'Agente de Reclutamiento HR',
                category: 'Recursos Humanos',
                role: 'Talent Acquisition Agent',
                description: 'Entrevista candidatos iniciales, filtra currículums y responde sobre vacantes activas.',
                icon: '👥',
                tools: ['search_crm'],
                temperature: 0.4,
                systemPrompt: `Eres el Reclutador Virtual de la empresa. Evalúa las competencias de los postulantes con preguntas estructuradas y mantén una comunicación ágil y transparente.`
            }
        ];
    }
    /**
     * Obtiene las categorías de agentes disponibles
     */
    static getCategories() {
        return ['Todos', 'Ventas & CRM', 'Atención al Cliente', 'Marketing & Contenido', 'Analítica', 'Bienes Raíces', 'Recursos Humanos'];
    }
}
exports.PresetGalleryService = PresetGalleryService;
//# sourceMappingURL=preset-gallery.service.js.map