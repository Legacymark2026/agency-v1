import Redis from 'ioredis';
const HISTORY_LIMIT = 15;
const CHAT_LIMIT = 10;
const TTL_SECONDS = 86400;
export class VideoSessionMemory {
    constructor(redisUrl) {
        this.redis = new Redis(redisUrl || process.env.REDIS_URL || 'redis://localhost:6379', {
            maxRetriesPerRequest: 3,
            retryStrategy: (times) => {
                if (times > 3)
                    return null;
                return Math.min(times * 200, 2000);
            },
        });
        this.redis.on('error', (err) => {
            console.error('[VideoSessionMemory] Redis error:', err);
        });
    }
    key(sessionId, segment) {
        return `video:session:${sessionId}:${segment}`;
    }
    // ─── State Memory (Working Memory) ─────────────────────────────────────────
    async saveState(sessionId, timeline) {
        await this.redis.set(this.key(sessionId, 'state'), JSON.stringify(timeline), 'EX', TTL_SECONDS);
    }
    async getState(sessionId) {
        const raw = await this.redis.get(this.key(sessionId, 'state'));
        if (!raw)
            return null;
        return JSON.parse(raw);
    }
    // ─── History (Undo/Redo Stack) ─────────────────────────────────────────────
    async pushHistory(sessionId, change) {
        await this.redis.lpush(this.key(sessionId, 'history'), JSON.stringify(change));
        await this.redis.ltrim(this.key(sessionId, 'history'), 0, HISTORY_LIMIT - 1);
        await this.redis.expire(this.key(sessionId, 'history'), TTL_SECONDS);
    }
    async getHistory(sessionId) {
        const raw = await this.redis.lrange(this.key(sessionId, 'history'), 0, -1);
        return raw.map(r => JSON.parse(r));
    }
    async undo(sessionId) {
        const history = await this.getHistory(sessionId);
        const lastChange = history.find(h => !h.undone);
        if (!lastChange)
            return null;
        lastChange.undone = true;
        await this.redis.lset(this.key(sessionId, 'history'), history.indexOf(lastChange), JSON.stringify(lastChange));
        return lastChange;
    }
    async redo(sessionId) {
        const history = await this.getHistory(sessionId);
        const lastUndone = [...history].reverse().find(h => h.undone);
        if (!lastUndone)
            return null;
        lastUndone.undone = false;
        const idx = history.findIndex(h => h.id === lastUndone.id);
        await this.redis.lset(this.key(sessionId, 'history'), idx, JSON.stringify(lastUndone));
        return lastUndone;
    }
    // ─── Chat Memory (Session Context) ─────────────────────────────────────────
    async pushMessage(sessionId, message) {
        await this.redis.lpush(this.key(sessionId, 'chat'), JSON.stringify(message));
        await this.redis.ltrim(this.key(sessionId, 'chat'), 0, CHAT_LIMIT - 1);
        await this.redis.expire(this.key(sessionId, 'chat'), TTL_SECONDS);
    }
    async getRecentMessages(sessionId) {
        const raw = await this.redis.lrange(this.key(sessionId, 'chat'), 0, -1);
        return raw.map(r => JSON.parse(r)).reverse();
    }
    // ─── Session Context ───────────────────────────────────────────────────────
    async saveContext(sessionId, context) {
        await this.redis.set(this.key(sessionId, 'context'), JSON.stringify(context), 'EX', TTL_SECONDS);
    }
    async getContext(sessionId) {
        const raw = await this.redis.get(this.key(sessionId, 'context'));
        if (!raw)
            return null;
        return JSON.parse(raw);
    }
    // ─── Cleanup ───────────────────────────────────────────────────────────────
    async clearSession(sessionId) {
        const keys = [
            this.key(sessionId, 'state'),
            this.key(sessionId, 'history'),
            this.key(sessionId, 'chat'),
            this.key(sessionId, 'context'),
        ];
        await this.redis.del(...keys);
    }
    async disconnect() {
        await this.redis.quit();
    }
}
