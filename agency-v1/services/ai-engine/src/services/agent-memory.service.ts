import Redis from 'ioredis';
import { prisma } from '@agency/database';

const REDIS_URL = process.env.REDIS_URL || 'redis://redis:6379';
let redis: Redis | null = null;

try {
  redis = new Redis(REDIS_URL, { maxRetriesPerRequest: 2, enableOfflineQueue: false });
  redis.on('error', (err) => console.warn('[AgentMemoryService] Redis notice:', err.message));
} catch (e) {
  console.warn('[AgentMemoryService] Redis init notice:', e);
}

export interface MemoryEntry {
  id: string;
  agentId: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

export class AgentMemoryService {
  /**
   * Registra una entrada de memoria conversacional en Redis y PostgreSQL
   */
  static async addMemory(agentId: string, conversationId: string, role: 'user' | 'assistant' | 'system' | 'tool', content: string, metadata?: Record<string, any>): Promise<MemoryEntry> {
    const entry: MemoryEntry = {
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
      } catch (e: any) {
        console.warn('[AgentMemoryService] Redis push notice:', e.message);
      }
    }

    // Persistir en base de datos si la tabla existe
    try {
      await (prisma as any).agentMemory.create({
        data: {
          agentId,
          conversationId,
          role,
          content,
          metadata: metadata ? JSON.stringify(metadata) : null
        }
      });
    } catch (e: any) {
      // Ignorar si la tabla aún no se ha migrado en Prisma
    }

    return entry;
  }

  /**
   * Obtiene el contexto conversacional reciente para pasar al modelo LLM
   */
  static async getConversationContext(conversationId: string, limit = 20): Promise<MemoryEntry[]> {
    if (redis && redis.status === 'ready') {
      try {
        const key = `agent_memory:${conversationId}`;
        const rawList = await redis.lrange(key, -limit, -1);
        if (rawList && rawList.length > 0) {
          return rawList.map((item) => JSON.parse(item) as MemoryEntry);
        }
      } catch (e: any) {
        console.warn('[AgentMemoryService] Redis read notice:', e.message);
      }
    }

    // Fallback a Prisma
    try {
      const records = await (prisma as any).agentMemory.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'desc' },
        take: limit
      });
      return records.reverse().map((r: any) => ({
        id: r.id,
        agentId: r.agentId,
        conversationId: r.conversationId,
        role: r.role,
        content: r.content,
        metadata: r.metadata ? JSON.parse(r.metadata) : null,
        timestamp: r.createdAt
      }));
    } catch {
      return [];
    }
  }

  /**
   * Borra el historial de contexto conversacional de un hilo
   */
  static async clearMemory(conversationId: string) {
    if (redis && redis.status === 'ready') {
      try {
        await redis.del(`agent_memory:${conversationId}`);
      } catch (e: any) {
        console.warn('[AgentMemoryService] Redis delete notice:', e.message);
      }
    }
  }
}
