"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HitlWorkflowService = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const events_1 = require("@agency/events");
const REDIS_URL = process.env.REDIS_URL || "redis://redis:6379";
const eventBus = new events_1.EventBus(REDIS_URL, "ai-engine");
let redis = null;
try {
    redis = new ioredis_1.default(REDIS_URL, { maxRetriesPerRequest: 2, enableOfflineQueue: false });
}
catch { }
class HitlWorkflowService {
    /**
     * Evalúa si una respuesta del agente requiere supervisión humana (Human-in-the-Loop)
     */
    static shouldRequireHumanReview(userMessage, proposedResponse, confidenceScore, toolExecuted) {
        // 1. Puntuación de confianza menor a 0.82
        if (confidenceScore < 0.82) {
            return { requiresReview: true, reason: `Confianza de IA por debajo del umbral de seguridad (${(confidenceScore * 100).toFixed(1)}% < 82%)` };
        }
        // 2. Herramientas críticas que modifican estados financieros o contratos
        if (toolExecuted === 'generate_quote') {
            const match = proposedResponse.match(/USD \$?([0-9,.]+)/i);
            if (match) {
                const amount = parseFloat(match[1].replace(/,/g, ''));
                if (amount > 3000) {
                    return { requiresReview: true, reason: `Cotización de alto valor (USD $${amount.toLocaleString()}) requiere aprobación supervisada` };
                }
            }
        }
        // 3. Palabras clave sensibles (cancelación de suscripción, reembolso, legal, demanda)
        const msgLower = userMessage.toLowerCase();
        if (msgLower.includes('demanda') || msgLower.includes('abogado') || msgLower.includes('reembolso') || msgLower.includes('cancelar contrato')) {
            return { requiresReview: true, reason: 'Consulta clasificada como asunto de Alto Riesgo / Legal' };
        }
        return { requiresReview: false };
    }
    /**
     * Registra una respuesta pendiente de aprobación humana en la cola
     */
    static async createPendingReview(input) {
        const item = {
            id: `hitl-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
            ...input,
            status: 'PENDING_APPROVAL',
            createdAt: new Date().toISOString()
        };
        // Guardar en Redis para el dashboard de supervisión humana
        if (redis && redis.status === 'ready') {
            try {
                await redis.hset(`hitl_queue:${input.companyId}`, item.id, JSON.stringify(item));
                await redis.publish(`hitl_events:${input.companyId}`, JSON.stringify({ type: 'HITL_CREATED', item }));
            }
            catch (e) {
                console.warn('[HitlWorkflowService] Redis error:', e.message);
            }
        }
        // Emitir evento para notificación en tiempo real en la app web
        try {
            await eventBus.publish('agent.hitl_review_required', item);
        }
        catch { }
        return item;
    }
    /**
     * Aprueba o modifica una respuesta retenida por Human-in-the-Loop
     */
    static async processDecision(hitlId, companyId, decision, userId, modifiedResponse) {
        let item = null;
        if (redis && redis.status === 'ready') {
            const raw = await redis.hget(`hitl_queue:${companyId}`, hitlId);
            if (raw)
                item = JSON.parse(raw);
        }
        if (!item) {
            throw new Error(`Ítem de supervisión HITL '${hitlId}' no encontrado.`);
        }
        item.status = decision;
        item.approvedBy = userId;
        item.finalResponse = decision === 'MODIFIED' ? (modifiedResponse || item.proposedResponse) : item.proposedResponse;
        if (redis && redis.status === 'ready') {
            if (decision === 'APPROVED' || decision === 'MODIFIED') {
                await redis.hdel(`hitl_queue:${companyId}`, hitlId);
            }
            else {
                await redis.hset(`hitl_queue:${companyId}`, hitlId, JSON.stringify(item));
            }
        }
        // Publicar evento de resolución
        try {
            await eventBus.publish('agent.hitl_decision_made', item);
        }
        catch { }
        return item;
    }
    /**
     * Obtiene la lista de ítems pendientes de revisión humana para la empresa
     */
    static async getPendingReviews(companyId) {
        if (redis && redis.status === 'ready') {
            try {
                const rawMap = await redis.hgetall(`hitl_queue:${companyId}`);
                return Object.values(rawMap).map(v => JSON.parse(v));
            }
            catch { }
        }
        return [];
    }
}
exports.HitlWorkflowService = HitlWorkflowService;
//# sourceMappingURL=hitl-workflow.service.js.map