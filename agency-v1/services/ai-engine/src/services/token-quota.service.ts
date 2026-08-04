import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://redis:6379';
let redis: Redis | null = null;

try {
  redis = new Redis(REDIS_URL, { maxRetriesPerRequest: 2, enableOfflineQueue: false });
  redis.on('error', (err) => console.warn('[TokenQuotaService] Redis notice:', err.message));
} catch (e) {
  console.warn('[TokenQuotaService] Redis init notice:', e);
}

const DEFAULT_DAILY_TOKEN_LIMIT = 500000; // 500k tokens por día por empresa

export class TokenQuotaService {
  /**
   * Verifica si la empresa o el agente superaron su cuota diaria de tokens LLM
   */
  static async checkQuota(companyId: string, agentId: string, requestedTokens = 1000) {
    if (!redis || redis.status !== 'ready') {
      return { allowed: true, currentUsage: 0, limit: DEFAULT_DAILY_TOKEN_LIMIT };
    }

    const today = new Date().toISOString().split('T')[0];
    const key = `llm_quota:${companyId}:${today}`;

    try {
      const currentStr = await redis.get(key);
      const currentUsage = parseInt(currentStr || '0', 10);

      if (currentUsage + requestedTokens > DEFAULT_DAILY_TOKEN_LIMIT) {
        return {
          allowed: false,
          currentUsage,
          limit: DEFAULT_DAILY_TOKEN_LIMIT,
          message: `Límite diario de tokens LLM alcanzado (${currentUsage.toLocaleString()} / ${DEFAULT_DAILY_TOKEN_LIMIT.toLocaleString()}). Por favor mejora tu plan.`
        };
      }

      return { allowed: true, currentUsage, limit: DEFAULT_DAILY_TOKEN_LIMIT };
    } catch (e: any) {
      console.warn('[TokenQuotaService] Check error:', e.message);
      return { allowed: true, currentUsage: 0, limit: DEFAULT_DAILY_TOKEN_LIMIT };
    }
  }

  /**
   * Registra el consumo de tokens tras la ejecución del modelo de IA
   */
  static async recordTokenUsage(companyId: string, agentId: string, promptTokens: number, completionTokens: number) {
    if (!redis || redis.status !== 'ready') return;

    const totalTokens = promptTokens + completionTokens;
    const today = new Date().toISOString().split('T')[0];
    const companyKey = `llm_quota:${companyId}:${today}`;
    const agentKey = `llm_quota:agent:${agentId}:${today}`;

    try {
      const pipeline = redis.pipeline();
      pipeline.incrby(companyKey, totalTokens);
      pipeline.expire(companyKey, 86400 * 2); // 48 horas TTL
      pipeline.incrby(agentKey, totalTokens);
      pipeline.expire(agentKey, 86400 * 2);
      await pipeline.exec();
    } catch (e: any) {
      console.warn('[TokenQuotaService] Record error:', e.message);
    }
  }
}
