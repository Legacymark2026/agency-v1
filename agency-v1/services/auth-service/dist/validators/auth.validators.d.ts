/**
 * services/auth-service/src/validators/auth.validators.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Zod schemas for Authentication and MFA resources
 */
import { z } from "zod";
export declare const loginSchema: z.ZodObject<{
    body: z.ZodObject<{
        email: z.ZodString;
        password: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        email: string;
        password: string;
    }, {
        email: string;
        password: string;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        email: string;
        password: string;
    };
}, {
    body: {
        email: string;
        password: string;
    };
}>;
export declare const enable2FASchema: z.ZodObject<{
    body: z.ZodObject<{
        userId: z.ZodString;
        secret: z.ZodString;
        token: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        userId: string;
        secret: string;
        token: string;
    }, {
        userId: string;
        secret: string;
        token: string;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        userId: string;
        secret: string;
        token: string;
    };
}, {
    body: {
        userId: string;
        secret: string;
        token: string;
    };
}>;
export declare const verify2FASchema: z.ZodObject<{
    body: z.ZodObject<{
        userId: z.ZodString;
        tokenOrBackupCode: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        userId: string;
        tokenOrBackupCode: string;
    }, {
        userId: string;
        tokenOrBackupCode: string;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        userId: string;
        tokenOrBackupCode: string;
    };
}, {
    body: {
        userId: string;
        tokenOrBackupCode: string;
    };
}>;
export declare const disable2FASchema: z.ZodObject<{
    body: z.ZodObject<{
        userId: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        userId: string;
    }, {
        userId: string;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        userId: string;
    };
}, {
    body: {
        userId: string;
    };
}>;
