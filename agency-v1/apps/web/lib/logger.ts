/**
 * lib/logger.ts
 * Logger estructurado con niveles — B-1 fix
 * En producción solo loggea errores y warnings (no console.log noise)
 */

const isDev = process.env.NODE_ENV === 'development';

export const logger = {
    /** Solo visible en desarrollo */
    log: (msg: string, ...args: unknown[]) => {
        if (isDev) console.log(msg, ...args);
    },
    /** Solo visible en desarrollo, prefijado con [AUTH] */
    auth: (msg: string, ...args: unknown[]) => {
        if (isDev) console.log(`[AUTH] ${msg}`, ...args);
    },
    /** Siempre visible (advertencias en producción también) */
    warn: (msg: string, ...args: unknown[]) => {
        console.warn(`[WARN] ${msg}`, ...args);
    },
    /** Siempre visible */
    error: (msg: string, ...args: unknown[]) => {
        console.error(`[ERROR] ${msg}`, ...args);
    },
};
