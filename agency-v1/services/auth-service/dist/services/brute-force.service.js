"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BruteForceService = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const REDIS_URL = process.env.REDIS_URL || 'redis://redis:6379';
let redis = null;
try {
    redis = new ioredis_1.default(REDIS_URL, { maxRetriesPerRequest: 2, enableOfflineQueue: false });
    redis.on('error', (err) => console.warn('[BruteForceService] Redis notice:', err.message));
}
catch (e) {
    console.warn('[BruteForceService] Redis init notice:', e);
}
const MAX_ATTEMPTS = 5;
const LOCKOUT_TTL_SECONDS = 900; // 15 minutos
class BruteForceService {
    /**
     * Verifica si la IP o la cuenta de usuario se encuentra bloqueada por intentos fallidos
     */
    static async checkLockout(ip, email) {
        if (!redis || redis.status !== 'ready')
            return { isLocked: false };
        const ipKey = `bf:ip:${ip}`;
        const emailKey = `bf:email:${email.toLowerCase().trim()}`;
        try {
            const [ipAttempts, emailAttempts] = await Promise.all([
                redis.get(ipKey),
                redis.get(emailKey)
            ]);
            const countIp = parseInt(ipAttempts || '0', 10);
            const countEmail = parseInt(emailAttempts || '0', 10);
            if (countIp >= MAX_ATTEMPTS || countEmail >= MAX_ATTEMPTS) {
                const ttlIp = await redis.ttl(ipKey);
                const ttlEmail = await redis.ttl(emailKey);
                const remainingSeconds = Math.max(ttlIp, ttlEmail, 60);
                const remainingMinutes = Math.ceil(remainingSeconds / 60);
                return {
                    isLocked: true,
                    remainingMinutes,
                    remainingSeconds,
                    message: `Cuenta o dirección IP bloqueada temporalmente por ${remainingMinutes} minutos debido a múltiples intentos fallidos.`
                };
            }
        }
        catch (e) {
            console.warn('[BruteForceService] Check error:', e.message);
        }
        return { isLocked: false };
    }
    /**
     * Incrementa el contador de intentos fallidos en Redis con expiración de 15 minutos
     */
    static async recordFailedAttempt(ip, email) {
        if (!redis || redis.status !== 'ready')
            return;
        const ipKey = `bf:ip:${ip}`;
        const emailKey = `bf:email:${email.toLowerCase().trim()}`;
        try {
            const pipeline = redis.pipeline();
            pipeline.incr(ipKey);
            pipeline.expire(ipKey, LOCKOUT_TTL_SECONDS);
            pipeline.incr(emailKey);
            pipeline.expire(emailKey, LOCKOUT_TTL_SECONDS);
            await pipeline.exec();
        }
        catch (e) {
            console.warn('[BruteForceService] Record failure error:', e.message);
        }
    }
    /**
     * Resetea el contador de intentos fallidos tras un inicio de sesión exitoso
     */
    static async resetLockout(ip, email) {
        if (!redis || redis.status !== 'ready')
            return;
        const ipKey = `bf:ip:${ip}`;
        const emailKey = `bf:email:${email.toLowerCase().trim()}`;
        try {
            await redis.del(ipKey, emailKey);
        }
        catch (e) {
            console.warn('[BruteForceService] Reset error:', e.message);
        }
    }
}
exports.BruteForceService = BruteForceService;
//# sourceMappingURL=brute-force.service.js.map