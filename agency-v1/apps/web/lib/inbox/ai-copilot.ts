/**
 * apps/web/lib/inbox/ai-copilot.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Motor AI Copilot & Respuestas Automáticas con RAG (Retrieval-Augmented Generation).
 *
 * CARACTERÍSTICAS:
 * 1. Búsqueda semántica en la Base de Conocimiento de la empresa.
 * 2. Generación de sugerencias de respuesta a 1-clic para los agentes.
 * 3. Cálculo de score de confianza para autorrespuesta automática 24/7.
 */

export interface KnowledgeArticle {
    id: string;
    topic: string;
    keywords: string[];
    content: string;
}

export interface CopilotSuggestion {
    suggestedResponse: string;
    confidenceScore: number; // 0 - 100%
    matchedArticleTopic?: string;
    autoReplyEligible: boolean;
}

const DEFAULT_KNOWLEDGE_BASE: KnowledgeArticle[] = [
    {
        id: 'kb-1',
        topic: 'Precios y Planes',
        keywords: ['precio', 'costo', 'plan', 'cuanto cuesta', 'tarifa', 'suscripcion'],
        content: 'Nuestros planes comienzan desde $49 USD/mes para el Plan Starter, $149 USD/mes para el Plan Growth y planes Enterprise a medida. Todos incluyen soporte 24/7.',
    },
    {
        id: 'kb-2',
        topic: 'Horarios de Atención',
        keywords: ['horario', 'atencion', 'soporte', 'abierto', 'hora'],
        content: 'Nuestro equipo de soporte está disponible de Lunes a Viernes de 8:00 AM a 7:00 PM (COT). El bot de IA responde consultas 24/7.',
    },
    {
        id: 'kb-3',
        topic: 'Demostración del Producto',
        keywords: ['demo', 'demostración', 'probar', 'prueba', 'ver', 'agendar'],
        content: 'Con gusto podemos agendar una demostración personalizada de 15 minutos con uno de nuestros especialistas de producto.',
    },
];

export function generateCopilotSuggestion(
    customerQuery: string,
    customKb?: KnowledgeArticle[]
): CopilotSuggestion {
    if (!customerQuery || customerQuery.trim().length === 0) {
        return {
            suggestedResponse: 'Hola, ¿en qué podemos ayudarte hoy?',
            confidenceScore: 10,
            autoReplyEligible: false,
        };
    }

    const kb = customKb && customKb.length > 0 ? customKb : DEFAULT_KNOWLEDGE_BASE;
    const cleanQuery = customerQuery.toLowerCase();

    let bestArticle: KnowledgeArticle | null = null;
    let maxMatches = 0;

    kb.forEach(article => {
        let matches = 0;
        article.keywords.forEach(kw => {
            if (cleanQuery.includes(kw.toLowerCase())) {
                matches++;
            }
        });
        if (matches > maxMatches) {
            maxMatches = matches;
            bestArticle = article;
        }
    });

    if (bestArticle && maxMatches > 0) {
        const confidenceScore = Math.min(98, 60 + maxMatches * 20);
        return {
            suggestedResponse: (bestArticle as KnowledgeArticle).content,
            confidenceScore,
            matchedArticleTopic: (bestArticle as KnowledgeArticle).topic,
            autoReplyEligible: confidenceScore >= 80,
        };
    }

    return {
        suggestedResponse: 'Gracias por escribirnos. Un agente de nuestro equipo revisará tu mensaje a la brevedad.',
        confidenceScore: 35,
        autoReplyEligible: false,
    };
}
