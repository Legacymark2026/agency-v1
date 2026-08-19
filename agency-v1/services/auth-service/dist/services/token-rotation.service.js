"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenRotationService = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const REDIS_URL = process.env.REDIS_URL || 'redis://redis:6379';
let redis = null;
try {
    redis = new ioredis_1.default(REDIS_URL, { maxRetriesPerRequest: 2, enableOfflineQueue: false });
    redis.on('error', (err) => console.warn('[TokenRotationService] Redis notice:', err.message));
}
catch (e) {
    console.warn('[TokenRotationService] Redis init notice:', e);
}
const JWT_SECRET = process.env.JWT_SECRET || 'legacymark_jwt_secret_dev_2026';
const ACCESS_TOKEN_TTL_SECONDS = 900; // 15 minutos
const REFRESH_TOKEN_TTL_SECONDS = 604800; // 7 días
class TokenRotationService {
    /**
     * Emite un par de tokens (Access 15m + Refresh 7d) y registra la sesión en Redis
     */
    static async issueTokenPair(userId, email, ip, userAgent, existingFamilyId) {
        const sessionId = crypto_1.default.randomUUID();
        const familyId = existingFamilyId || crypto_1.default.randomUUID();
        const now = new Date().toISOString();
        const payload = { userId, email, sessionId, familyId };
        // Access Token de vida corta (15 min)
        const accessToken = jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn: '15m' });
        // Refresh Token (7 días)
        const refreshToken = jsonwebtoken_1.default.sign({ ...payload, isRefresh: true }, JWT_SECRET, { expiresIn: '7d' });
        // Registrar sesión en Redis
        if (redis && redis.status === 'ready') {
            try {
                const sessionData = {
                    sessionId,
                    familyId,
                    userId,
                    email,
                    ip: ip || '0.0.0.0',
                    userAgent: userAgent || 'Unknown Device',
                    createdAt: now
                };
                const sessionKey = `session:${userId}:${sessionId}`;
                const familyKey = `family:${familyId}:${sessionId}`;
                await Promise.all([
                    redis.set(sessionKey, JSON.stringify(sessionData), 'EX', REFRESH_TOKEN_TTL_SECONDS),
                    redis.set(familyKey, sessionId, 'EX', REFRESH_TOKEN_TTL_SECONDS)
                ]);
            }
            catch (e) {
                console.warn('[TokenRotationService] Issue error:', e.message);
            }
        }
        return {
            accessToken,
            refreshToken,
            expiresIn: ACCESS_TOKEN_TTL_SECONDS
        };
    }
    /**
     * Rota un Refresh Token (RTR): Invalida el token anterior y emite uno nuevo.
     * Si se detecta un token consumido previamente (ataque de réplica), REVOCA TODAS LAS SESIONES DEL USUARIO.
     */
    static async rotateRefreshToken(oldRefreshToken, ip, userAgent) {
        let decoded = null;
        try {
            decoded = jsonwebtoken_1.default.verify(oldRefreshToken, JWT_SECRET);
        }
        catch (e) {
            throw new Error('Refresh token inválido o expirado.');
        }
        if (!decoded || !decoded.isRefresh || !decoded.sessionId || !decoded.userId) {
            throw new Error('Formato de refresh token no válido.');
        }
        const { userId, email, sessionId, familyId } = decoded;
        if (redis && redis.status === 'ready') {
            const sessionKey = `session:${userId}:${sessionId}`;
            const sessionExists = await redis.exists(sessionKey);
            // 🚨 ALERTA DE SEGURIDAD: El refresh token ya no existe en Redis (ha sido consumido o revocado).
            // Se asume ataque de reuso de token (Token Reuse Attack) -> REVOCAR TODAS LAS SESIONES DE LA CUENTA
            if (!sessionExists) {
                console.warn(`[SECURITY ALERT] Reuso de Refresh Token consumido para el usuario [${userId}]. Revocando todas las sesiones.`);
                await this.revokeAllUserSessions(userId);
                throw new Error('Alerta de seguridad: Se detectó un intento de reuso de sesión. Todas las sesiones activas han sido cerradas.');
            }
            // Eliminar la sesión consumida
            await redis.del(sessionKey, `family:${familyId}:${sessionId}`);
        }
        // Emitir nuevo par de tokens preservando el familyId
        return await this.issueTokenPair(userId, email, ip, userAgent, familyId);
    }
    /**
     * Cierra la sesión activa actual en Redis
     */
    static async logoutSession(userId, sessionId) {
        if (!redis || redis.status !== 'ready')
            return;
        try {
            await redis.del(`session:${userId}:${sessionId}`);
        }
        catch (e) {
            console.warn('[TokenRotationService] Logout error:', e.message);
        }
    }
    /**
     * Cierre de sesión de emergencia: Revoca TODAS las sesiones activas del usuario en Redis
     */
    static async revokeAllUserSessions(userId) {
        if (!redis || redis.status !== 'ready')
            return;
        try {
            const keys = await redis.keys(`session:${userId}:*`);
            if (keys.length > 0) {
                await redis.del(...keys);
            }
        }
        catch (e) {
            console.warn('[TokenRotationService] Revoke all error:', e.message);
        }
    }
    /**
     * Obtiene la lista de sesiones activas del usuario
     */
    static async getActiveUserSessions(userId) {
        if (!redis || redis.status !== 'ready')
            return [];
        try {
            const keys = await redis.keys(`session:${userId}:*`);
            if (keys.length === 0)
                return [];
            const values = await redis.mget(...keys);
            return values
                .filter((v) => v !== null)
                .map((v) => JSON.parse(v));
        }
        catch (e) {
            console.warn('[TokenRotationService] Get sessions error:', e.message);
            return [];
        }
    }
}
exports.TokenRotationService = TokenRotationService;
//# sourceMappingURL=token-rotation.service.js.map