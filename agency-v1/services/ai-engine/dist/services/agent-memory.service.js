"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentMemoryService = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const database_1 = require("@agency/database");
const REDIS_URL = process.env.REDIS_URL || 'redis://redis:6379';
let redis = null;
try {
    redis = new ioredis_1.default(REDIS_URL, { maxRetriesPerRequest: 2, enableOfflineQueue: false });
    redis.on('error', (err) => console.warn('[AgentMemoryService] Redis notice:', err.message));
}
catch (e) {
    console.warn('[AgentMemoryService] Redis init notice:', e);
}
class AgentMemoryService {
    /**
     * Registra una entrada de memoria conversacional en Redis y PostgreSQL
     */
    static async addMemory(agentId, conversationId, role, content, metadata) {
        const entry = {
            id: `mem-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
            agentId,
            conversationId,
            role,
            content,
            metadata,
            timestamp: new Date().toISOString()
        };
        // Guardar en Redis para lectura ultra-rápida (<2ms)
        if (redis && redis.status === 'ready') {
            try {
                const key = `agent_memory:${conversationId}`;
                await redis.rpush(key, JSON.stringify(entry));
                await redis.expire(key, 86400 * 7); // 7 días TTL en caché
            }
            catch (e) {
                console.warn('[AgentMemoryService] Redis push notice:', e.message);
            }
        }
        // Persistir en base de datos si la tabla existe
        try {
            await database_1.prisma.agentMemory.create({
                data: {
                    agentId,
                    conversationId,
                    role,
                    content,
                    metadata: metadata ? JSON.stringify(metadata) : null
                }
            });
        }
        catch (e) {
            // Ignorar si la tabla aún no se ha migrado en Prisma
        }
        return entry;
    }
    /**
     * Obtiene el contexto conversacional reciente para pasar al modelo LLM
     */
    static async getConversationContext(conversationId, limit = 20) {
        if (redis && redis.status === 'ready') {
            try {
                const key = `agent_memory:${conversationId}`;
                const rawList = await redis.lrange(key, -limit, -1);
                if (rawList && rawList.length > 0) {
                    return rawList.map((item) => JSON.parse(item));
                }
            }
            catch (e) {
                console.warn('[AgentMemoryService] Redis read notice:', e.message);
            }
        }
        // Fallback a Prisma
        try {
            const records = await database_1.prisma.agentMemory.findMany({
                where: { conversationId },
                orderBy: { createdAt: 'desc' },
                take: limit
            });
            return records.reverse().map((r) => ({
                id: r.id,
                agentId: r.agentId,
                conversationId: r.conversationId,
                role: r.role,
                content: r.content,
                metadata: r.metadata ? JSON.parse(r.metadata) : null,
                timestamp: r.createdAt
            }));
        }
        catch {
            return [];
        }
    }
    /**
     * Borra el historial de contexto conversacional de un hilo
     */
    static async clearMemory(conversationId) {
        if (redis && redis.status === 'ready') {
            try {
                await redis.del(`agent_memory:${conversationId}`);
            }
            catch (e) {
                console.warn('[AgentMemoryService] Redis delete notice:', e.message);
            }
        }
    }
}
exports.AgentMemoryService = AgentMemoryService;
//# sourceMappingURL=agent-memory.service.js.map