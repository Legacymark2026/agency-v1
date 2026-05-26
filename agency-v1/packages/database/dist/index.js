"use strict";
/**
 * @agency/database — Shared Database Package
 * ─────────────────────────────────────────────────────────────────────────────
 * Central Prisma client and type exports for all microservices.
 *
 * Usage in any service:
 *   import { prisma, Prisma } from "@agency/database";
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = exports.getPrismaAnalytics = exports.getPrismaMedia = exports.getPrismaCore = exports.getPrismaAuth = exports.Prisma = exports.PrismaClient = void 0;
const auth_1 = require("@prisma/client/auth");
const core_1 = require("@prisma/client/core");
const media_1 = require("@prisma/client/media");
const analytics_1 = require("@prisma/client/analytics");
// Re-export everything from the main Prisma Client for type safety and backward compatibility
var client_1 = require("@prisma/client");
Object.defineProperty(exports, "PrismaClient", { enumerable: true, get: function () { return client_1.PrismaClient; } });
var client_2 = require("@prisma/client");
Object.defineProperty(exports, "Prisma", { enumerable: true, get: function () { return client_2.Prisma; } });
// Instancias de singleton cargadas de manera perezosa (lazy)
let _prismaAuth = null;
let _prismaCore = null;
let _prismaMedia = null;
let _prismaAnalytics = null;
const getPrismaAuth = () => {
    if (!_prismaAuth) {
        _prismaAuth = new auth_1.PrismaClient({
            log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
            datasources: { db: { url: process.env.AUTH_DATABASE_URL || process.env.DATABASE_URL } },
        });
    }
    return _prismaAuth;
};
exports.getPrismaAuth = getPrismaAuth;
const getPrismaCore = () => {
    if (!_prismaCore) {
        _prismaCore = new core_1.PrismaClient({
            log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
            datasources: { db: { url: process.env.CORE_DATABASE_URL || process.env.DATABASE_URL } },
        });
    }
    return _prismaCore;
};
exports.getPrismaCore = getPrismaCore;
const getPrismaMedia = () => {
    if (!_prismaMedia) {
        _prismaMedia = new media_1.PrismaClient({
            log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
            datasources: { db: { url: process.env.MEDIA_DATABASE_URL || process.env.DATABASE_URL } },
        });
    }
    return _prismaMedia;
};
exports.getPrismaMedia = getPrismaMedia;
const getPrismaAnalytics = () => {
    if (!_prismaAnalytics) {
        _prismaAnalytics = new analytics_1.PrismaClient({
            log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
            datasources: { db: { url: process.env.ANALYTICS_DATABASE_URL || process.env.DATABASE_URL } },
        });
    }
    return _prismaAnalytics;
};
exports.getPrismaAnalytics = getPrismaAnalytics;
// Mapa para asociar cada modelo con su cliente de base de datos específico
const modelToClientGetter = {
    // Auth & RBAC
    user: exports.getPrismaAuth,
    userProfile: exports.getPrismaAuth,
    account: exports.getPrismaAuth,
    session: exports.getPrismaAuth,
    verificationToken: exports.getPrismaAuth,
    passwordResetToken: exports.getPrismaAuth,
    roleConfig: exports.getPrismaAuth,
    role: exports.getPrismaAuth,
    permission: exports.getPrismaAuth,
    rolePermission: exports.getPrismaAuth,
    resourcePermission: exports.getPrismaAuth,
    apiKey: exports.getPrismaAuth,
    // Core & CRM
    company: exports.getPrismaCore,
    companyUser: exports.getPrismaCore,
    team: exports.getPrismaCore,
    lead: exports.getPrismaCore,
    deal: exports.getPrismaCore,
    invoice: exports.getPrismaCore,
    expense: exports.getPrismaCore,
    servicePrice: exports.getPrismaCore,
    kanbanProject: exports.getPrismaCore,
    // Media, AI & Workflows
    post: exports.getPrismaMedia,
    category: exports.getPrismaMedia,
    tag: exports.getPrismaMedia,
    project: exports.getPrismaMedia,
    workflow: exports.getPrismaMedia,
    campaign: exports.getPrismaMedia,
    socialPost: exports.getPrismaMedia,
    aiAgent: exports.getPrismaMedia,
    agentMemory: exports.getPrismaMedia,
    // Analytics & Logs
    userActivityLog: exports.getPrismaAnalytics,
    projectView: exports.getPrismaAnalytics,
    postView: exports.getPrismaAnalytics,
    usageLog: exports.getPrismaAnalytics,
    integrationLog: exports.getPrismaAnalytics,
    notificationDeliveryLog: exports.getPrismaAnalytics,
};
// Singleton global para compatibilidad con hot-reload en Next.js
const globalForPrisma = globalThis;
exports.prisma = globalForPrisma.prisma ??
    new Proxy({}, {
        get(target, prop) {
            if (typeof prop === "symbol")
                return target[prop];
            // Redirigir el acceso al modelo correspondiente si está mapeado
            const clientGetter = modelToClientGetter[prop];
            if (clientGetter) {
                return clientGetter()[prop];
            }
            // Por defecto, delegar métodos de utilidad ($queryRaw, $connect, etc.) al cliente core
            const coreClient = (0, exports.getPrismaCore)();
            // Manejo de transacciones distribuidas en el Proxy (Best-Effort)
            if (prop === "$transaction") {
                return async (arg, options) => {
                    if (Array.isArray(arg)) {
                        // Ejecutar operaciones secuenciales
                        const results = [];
                        for (const op of arg) {
                            results.push(await op);
                        }
                        return results;
                    }
                    if (typeof arg === "function") {
                        // Pasar un contexto Proxy para transacciones interactivas
                        const txProxy = new Proxy({}, {
                            get(txTarget, txProp) {
                                if (typeof txProp === "symbol")
                                    return txTarget[txProp];
                                const getter = modelToClientGetter[txProp];
                                if (getter) {
                                    return getter()[txProp];
                                }
                                return coreClient[txProp];
                            }
                        });
                        return await arg(txProxy);
                    }
                    return await coreClient.$transaction(arg, options);
                };
            }
            // Delegar llamadas a funciones nativas ($queryRaw, $executeRaw, etc.)
            if (typeof coreClient[prop] === "function") {
                return (...args) => coreClient[prop](...args);
            }
            return coreClient[prop];
        }
    });
if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = exports.prisma;
}
exports.default = exports.prisma;
//# sourceMappingURL=index.js.map