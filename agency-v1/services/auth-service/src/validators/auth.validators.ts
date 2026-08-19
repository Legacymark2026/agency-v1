/**
 * services/auth-service/src/validators/auth.validators.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Zod schemas for Authentication and MFA resources
 */

import { z } from "zod";

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email("Formato de email inválido"),
    password: z.string().min(1, "La contraseña es requerida"),
  }),
});

export const enable2FASchema = z.object({
  body: z.object({
    userId: z.string().min(1, "El ID de usuario es requerido"),
    secret: z.string().min(1, "El secreto es requerido"),
    token: z.string().length(6, "El código TOTP debe tener exactamente 6 dígitos"),
  }),
});

export const verify2FASchema = z.object({
  body: z.object({
    userId: z.string().min(1, "El ID de usuario es requerido"),
    tokenOrBackupCode: z.string().min(1, "El código de verificación es requerido"),
  }),
});

export const disable2FASchema = z.object({
  body: z.object({
    userId: z.string().min(1, "El ID de usuario es requerido"),
  }),
});
