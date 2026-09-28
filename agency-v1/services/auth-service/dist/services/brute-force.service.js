"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BruteForceService = void 0;
const event_bus_singleton_1 = require("../lib/event-bus.singleton");
const MAX_ATTEMPTS = 5;
const LOCKOUT_TTL_SECONDS = 900; // 15 minutos
class BruteForceService {
    /**
     * Verifica si la IP o la cuenta de usuario se encuentra bloqueada por intentos fallidos
     */
    static async checkLockout(ip, email) {
        if (!event_bus_singleton_1.redisClient || event_bus_singleton_1.redisClient.status !== 'ready')
            return { isLocked: false };
        const ipKey = `bf:ip:${ip}`;
        const emailKey = `bf:email:${email.toLowerCase().trim()}`;
        try {
            const [ipAttempts, emailAttempts] = await Promise.all([
                event_bus_singleton_1.redisClient.get(ipKey),
                event_bus_singleton_1.redisClient.get(emailKey)
            ]);
            const countIp = parseInt(ipAttempts || '0', 10);
            const countEmail = parseInt(emailAttempts || '0', 10);
            if (countIp >= MAX_ATTEMPTS || countEmail >= MAX_ATTEMPTS) {
                const ttlIp = await event_bus_singleton_1.redisClient.ttl(ipKey);
                const ttlEmail = await event_bus_singleton_1.redisClient.ttl(emailKey);
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
        if (!event_bus_singleton_1.redisClient || event_bus_singleton_1.redisClient.status !== 'ready')
            return;
        const ipKey = `bf:ip:${ip}`;
        const emailKey = `bf:email:${email.toLowerCase().trim()}`;
        try {
            const pipeline = event_bus_singleton_1.redisClient.pipeline();
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
        if (!event_bus_singleton_1.redisClient || event_bus_singleton_1.redisClient.status !== 'ready')
            return;
        const ipKey = `bf:ip:${ip}`;
        const emailKey = `bf:email:${email.toLowerCase().trim()}`;
        try {
            await event_bus_singleton_1.redisClient.del(ipKey, emailKey);
        }
        catch (e) {
            console.warn('[BruteForceService] Reset error:', e.message);
        }
    }
}
exports.BruteForceService = BruteForceService;
//# sourceMappingURL=brute-force.service.js.map