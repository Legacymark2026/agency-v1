"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const auth_service_1 = require("../services/auth.service");
const brute_force_service_1 = require("../services/brute-force.service");
const token_rotation_service_1 = require("../services/token-rotation.service");
function getStr(val) {
    if (!val)
        return '';
    if (Array.isArray(val))
        return String(val[0] || '');
    return String(val);
}
class AuthController {
    /**
     * POST /api/auth/login
     */
    static async login(req, res, next, privateKey) {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                return res.status(400).json({ success: false, error: "Email y contraseña requeridos" });
            }
            const clientIp = req.ip || getStr(req.headers['x-forwarded-for']) || '0.0.0.0';
            const userAgent = getStr(req.headers['user-agent']);
            // 🛡️ 1. Verificar si la IP o la cuenta se encuentra bloqueada por Anti-Fuerza Bruta
            const lockout = await brute_force_service_1.BruteForceService.checkLockout(clientIp, email);
            if (lockout.isLocked) {
                return res.status(429).json({ success: false, error: lockout.message, remainingMinutes: lockout.remainingMinutes });
            }
            let result = null;
            try {
                result = await auth_service_1.AuthService.login({
                    email,
                    password,
                    ipAddress: clientIp,
                    userAgent,
                }, privateKey);
            }
            catch (err) {
                // 🚨 2. Registrar intento fallido en Redis
                await brute_force_service_1.BruteForceService.recordFailedAttempt(clientIp, email);
                if (err.message === "INVALID_CREDENTIALS") {
                    return res.status(401).json({ success: false, error: "Credenciales inválidas" });
                }
                if (err.message === "ACCOUNT_DEACTIVATED") {
                    return res.status(403).json({ success: false, error: "Cuenta desactivada" });
                }
                throw err;
            }
            // ✅ 3. Resetear contador de bloqueos tras login exitoso
            await brute_force_service_1.BruteForceService.resetLockout(clientIp, email);
            // 🔄 4. Emitir par de tokens con Rotación (RTR) y registro en Redis
            const userId = result.user?.id || result.userId || 'user-1';
            const tokens = await token_rotation_service_1.TokenRotationService.issueTokenPair(userId, email, clientIp, userAgent);
            res.setHeader("Set-Cookie", `refresh_token=${encodeURIComponent(tokens.refreshToken)}; Path=/api/v1/auth/refresh; HttpOnly; Secure; SameSite=Strict; Max-Age=${7 * 24 * 60 * 60}`);
            res.json({
                success: true,
                ...result,
                accessToken: tokens.accessToken,
                expiresIn: tokens.expiresIn
            });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * POST /api/v1/auth/refresh — Rotación de Refresh Token (RTR)
     */
    static async refresh(req, res, next) {
        try {
            let refreshToken = req.body.refreshToken;
            if (!refreshToken) {
                const cookies = req.headers.cookie || "";
                const match = cookies.match(/(?:^|; )refresh_token=([^;]*)/);
                refreshToken = match ? decodeURIComponent(match[1]) : undefined;
            }
            if (!refreshToken) {
                return res.status(400).json({ success: false, error: "refreshToken es requerido" });
            }
            const clientIp = req.ip || getStr(req.headers['x-forwarded-for']) || '0.0.0.0';
            const userAgent = getStr(req.headers['user-agent']);
            const tokens = await token_rotation_service_1.TokenRotationService.rotateRefreshToken(refreshToken, clientIp, userAgent);
            res.setHeader("Set-Cookie", `refresh_token=${encodeURIComponent(tokens.refreshToken)}; Path=/api/v1/auth/refresh; HttpOnly; Secure; SameSite=Strict; Max-Age=${7 * 24 * 60 * 60}`);
            res.json({ success: true, accessToken: tokens.accessToken, expiresIn: tokens.expiresIn });
        }
        catch (err) {
            res.status(401).json({ success: false, error: err.message || 'Refresh token inválido' });
        }
    }
    /**
     * POST /api/v1/auth/logout-all — Revocación remota de todas las sesiones
     */
    static async logoutAll(req, res, next) {
        try {
            const userId = getStr(req.body.userId || req.headers['x-user-id']);
            if (!userId) {
                return res.status(400).json({ success: false, error: "userId es requerido" });
            }
            await token_rotation_service_1.TokenRotationService.revokeAllUserSessions(userId);
            res.json({ success: true, message: "Todas las sesiones activas han sido revocadas exitosamente." });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * GET /api/v1/auth/sessions — Obtener lista de sesiones activas en Redis
     */
    static async getSessions(req, res, next) {
        try {
            const userId = getStr(req.query.userId || req.headers['x-user-id']);
            if (!userId) {
                return res.status(400).json({ success: false, error: "userId es requerido" });
            }
            const sessions = await token_rotation_service_1.TokenRotationService.getActiveUserSessions(userId);
            res.json({ success: true, data: sessions });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * GET /api/auth/profile
     */
    static async getProfile(req, res, next) {
        try {
            const userId = getStr(req.headers["x-user-id"]);
            if (!userId) {
                return res.status(401).json({ success: false, error: "No autorizado" });
            }
            const profile = await auth_service_1.AuthService.getUserProfile(userId);
            res.json({ success: true, user: profile });
        }
        catch (err) {
            if (err.message === "USER_NOT_FOUND") {
                return res.status(404).json({ success: false, error: "Usuario no encontrado" });
            }
            next(err);
        }
    }
}
exports.AuthController = AuthController;
//# sourceMappingURL=auth.controller.js.map