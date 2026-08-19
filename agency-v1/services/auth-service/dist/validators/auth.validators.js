"use strict";
/**
 * services/auth-service/src/validators/auth.validators.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Zod schemas for Authentication and MFA resources
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.disable2FASchema = exports.verify2FASchema = exports.enable2FASchema = exports.loginSchema = void 0;
const zod_1 = require("zod");
exports.loginSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email("Formato de email inválido"),
        password: zod_1.z.string().min(1, "La contraseña es requerida"),
    }),
});
exports.enable2FASchema = zod_1.z.object({
    body: zod_1.z.object({
        userId: zod_1.z.string().min(1, "El ID de usuario es requerido"),
        secret: zod_1.z.string().min(1, "El secreto es requerido"),
        token: zod_1.z.string().length(6, "El código TOTP debe tener exactamente 6 dígitos"),
    }),
});
exports.verify2FASchema = zod_1.z.object({
    body: zod_1.z.object({
        userId: zod_1.z.string().min(1, "El ID de usuario es requerido"),
        tokenOrBackupCode: zod_1.z.string().min(1, "El código de verificación es requerido"),
    }),
});
exports.disable2FASchema = zod_1.z.object({
    body: zod_1.z.object({
        userId: zod_1.z.string().min(1, "El ID de usuario es requerido"),
    }),
});
//# sourceMappingURL=auth.validators.js.map