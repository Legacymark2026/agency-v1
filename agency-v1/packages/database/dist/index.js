"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = exports.getPrismaAnalyticsRead = exports.getPrismaMediaRead = exports.getPrismaCoreRead = exports.getPrismaAuthRead = exports.getPrismaAnalytics = exports.getPrismaMedia = exports.getPrismaCore = exports.getPrismaAuth = exports.Prisma = exports.PrismaClient = exports.primaryDatabaseStorage = void 0;
exports.runInPrimary = runInPrimary;
const client_1 = require("@prisma/client");
const async_hooks_1 = require("async_hooks");
exports.primaryDatabaseStorage = new async_hooks_1.AsyncLocalStorage();
function runInPrimary(fn) {
    return exports.primaryDatabaseStorage.run(true, fn);
}
// Re-export everything from the main Prisma Client for type safety and backward compatibility
var client_2 = require("@prisma/client");
Object.defineProperty(exports, "PrismaClient", { enumerable: true, get: function () { return client_2.PrismaClient; } });
var client_3 = require("@prisma/client");
Object.defineProperty(exports, "Prisma", { enumerable: true, get: function () { return client_3.Prisma; } });
// Instancias de singleton cargadas de manera perezosa (lazy)
let _prismaAuth = null;
let _prismaCore = null;
let _prismaMedia = null;
let _prismaAnalytics = null;
// Instancias de réplica de lectura
let _prismaAuthRead = null;
let _prismaCoreRead = null;
let _prismaMediaRead = null;
let _prismaAnalyticsRead = null;
const logConfig = process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"];
const getPrismaAuth = () => {
    if (!_prismaAuth) {
        const url = process.env.AUTH_DATABASE_URL || process.env.DATABASE_URL;
        _prismaAuth = new client_1.PrismaClient({
            log: logConfig,
            datasources: url ? { db: { url } } : undefined,
        });
    }
    return _prismaAuth;
};
exports.getPrismaAuth = getPrismaAuth;
const getPrismaCore = () => {
    if (!_prismaCore) {
        const url = process.env.CORE_DATABASE_URL || process.env.DATABASE_URL;
        _prismaCore = new client_1.PrismaClient({
            log: logConfig,
            datasources: url ? { db: { url } } : undefined,
        });
    }
    return _prismaCore;
};
exports.getPrismaCore = getPrismaCore;
const getPrismaMedia = () => {
    if (!_prismaMedia) {
        const url = process.env.MEDIA_DATABASE_URL || process.env.DATABASE_URL;
        _prismaMedia = new client_1.PrismaClient({
            log: logConfig,
            datasources: url ? { db: { url } } : undefined,
        });
    }
    return _prismaMedia;
};
exports.getPrismaMedia = getPrismaMedia;
const getPrismaAnalytics = () => {
    if (!_prismaAnalytics) {
        const url = process.env.ANALYTICS_DATABASE_URL || process.env.DATABASE_URL;
        _prismaAnalytics = new client_1.PrismaClient({
            log: logConfig,
            datasources: url ? { db: { url } } : undefined,
        });
    }
    return _prismaAnalytics;
};
exports.getPrismaAnalytics = getPrismaAnalytics;
// Getters de réplicas de lectura
const getPrismaAuthRead = () => {
    if (!_prismaAuthRead) {
        const url = process.env.AUTH_DATABASE_READ_URL || process.env.DATABASE_READ_URL || process.env.AUTH_DATABASE_URL || process.env.DATABASE_URL;
        _prismaAuthRead = new client_1.PrismaClient({
            log: logConfig,
            datasources: url ? { db: { url } } : undefined,
        });
    }
    return _prismaAuthRead;
};
exports.getPrismaAuthRead = getPrismaAuthRead;
const getPrismaCoreRead = () => {
    if (!_prismaCoreRead) {
        const url = process.env.CORE_DATABASE_READ_URL || process.env.DATABASE_READ_URL || process.env.CORE_DATABASE_URL || process.env.DATABASE_URL;
        _prismaCoreRead = new client_1.PrismaClient({
            log: logConfig,
            datasources: url ? { db: { url } } : undefined,
        });
    }
    return _prismaCoreRead;
};
exports.getPrismaCoreRead = getPrismaCoreRead;
const getPrismaMediaRead = () => {
    if (!_prismaMediaRead) {
        const url = process.env.MEDIA_DATABASE_READ_URL || process.env.DATABASE_READ_URL || process.env.MEDIA_DATABASE_URL || process.env.DATABASE_URL;
        _prismaMediaRead = new client_1.PrismaClient({
            log: logConfig,
            datasources: url ? { db: { url } } : undefined,
        });
    }
    return _prismaMediaRead;
};
exports.getPrismaMediaRead = getPrismaMediaRead;
const getPrismaAnalyticsRead = () => {
    if (!_prismaAnalyticsRead) {
        const url = process.env.ANALYTICS_DATABASE_READ_URL || process.env.DATABASE_READ_URL || process.env.ANALYTICS_DATABASE_URL || process.env.DATABASE_URL;
        _prismaAnalyticsRead = new client_1.PrismaClient({
            log: logConfig,
            datasources: url ? { db: { url } } : undefined,
        });
    }
    return _prismaAnalyticsRead;
};
exports.getPrismaAnalyticsRead = getPrismaAnalyticsRead;
// Mapa para asociar cada modelo con su cliente primario
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
    leadAssignmentRule: exports.getPrismaCore,
    leadAssignmentRoundRobinState: exports.getPrismaCore,
    affiliateProfile: exports.getPrismaCore,
    commissionPlan: exports.getPrismaCore,
    click: exports.getPrismaCore,
    referral: exports.getPrismaCore,
    payout: exports.getPrismaCore,
    inboxMacro: exports.getPrismaCore,
    emailTemplate: exports.getPrismaCore,
    outboxEvent: exports.getPrismaCore,
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
// Mapa para asociar cada modelo con su cliente de réplica de lectura
const modelToReadClientGetter = {
    // Auth & RBAC
    user: exports.getPrismaAuthRead,
    userProfile: exports.getPrismaAuthRead,
    account: exports.getPrismaAuthRead,
    session: exports.getPrismaAuthRead,
    verificationToken: exports.getPrismaAuthRead,
    passwordResetToken: exports.getPrismaAuthRead,
    roleConfig: exports.getPrismaAuthRead,
    role: exports.getPrismaAuthRead,
    permission: exports.getPrismaAuthRead,
    rolePermission: exports.getPrismaAuthRead,
    resourcePermission: exports.getPrismaAuthRead,
    apiKey: exports.getPrismaAuthRead,
    // Core & CRM
    company: exports.getPrismaCoreRead,
    companyUser: exports.getPrismaCoreRead,
    team: exports.getPrismaCoreRead,
    lead: exports.getPrismaCoreRead,
    deal: exports.getPrismaCoreRead,
    invoice: exports.getPrismaCoreRead,
    expense: exports.getPrismaCoreRead,
    servicePrice: exports.getPrismaCoreRead,
    kanbanProject: exports.getPrismaCoreRead,
    leadAssignmentRule: exports.getPrismaCoreRead,
    leadAssignmentRoundRobinState: exports.getPrismaCoreRead,
    affiliateProfile: exports.getPrismaCoreRead,
    commissionPlan: exports.getPrismaCoreRead,
    click: exports.getPrismaCoreRead,
    referral: exports.getPrismaCoreRead,
    payout: exports.getPrismaCoreRead,
    inboxMacro: exports.getPrismaCoreRead,
    emailTemplate: exports.getPrismaCoreRead,
    outboxEvent: exports.getPrismaCoreRead,
    // Media, AI & Workflows
    post: exports.getPrismaMediaRead,
    category: exports.getPrismaMediaRead,
    tag: exports.getPrismaMediaRead,
    project: exports.getPrismaMediaRead,
    workflow: exports.getPrismaMediaRead,
    campaign: exports.getPrismaMediaRead,
    socialPost: exports.getPrismaMediaRead,
    aiAgent: exports.getPrismaMediaRead,
    agentMemory: exports.getPrismaMediaRead,
    // Analytics & Logs
    userActivityLog: exports.getPrismaAnalyticsRead,
    projectView: exports.getPrismaAnalyticsRead,
    postView: exports.getPrismaAnalyticsRead,
    usageLog: exports.getPrismaAnalyticsRead,
    integrationLog: exports.getPrismaAnalyticsRead,
    notificationDeliveryLog: exports.getPrismaAnalyticsRead,
};
// Singleton global para Next.js hot-reload
const globalForPrisma = globalThis;
exports.prisma = globalForPrisma.prisma ??
    new Proxy({}, {
        get(target, prop) {
            if (typeof prop === "symbol")
                return target[prop];
            // Redirigir consultas de lectura cruda a la réplica (a menos que se fuerce lectura al primario)
            if (prop === "$queryRaw" || prop === "$queryRawUnsafe") {
                const client = exports.primaryDatabaseStorage.getStore() ? (0, exports.getPrismaCore)() : (0, exports.getPrismaCoreRead)();
                return (...args) => client[prop](...args);
            }
            // Redirigir el acceso al modelo correspondiente si está mapeado
            const clientGetter = modelToClientGetter[prop];
            if (clientGetter) {
                const primaryModel = clientGetter()[prop];
                // Retornar un proxy sobre el modelo para interceptar lecturas
                return new Proxy(primaryModel, {
                    get(modelTarget, methodProp) {
                        const readMethods = ["findMany", "findUnique", "findFirst", "count", "aggregate", "groupBy", "findRaw", "aggregateRaw"];
                        if (typeof methodProp === "string" &&
                            readMethods.includes(methodProp) &&
                            !exports.primaryDatabaseStorage.getStore()) {
                            const readClientGetter = modelToReadClientGetter[prop];
                            if (readClientGetter) {
                                const readModel = readClientGetter()[prop];
                                return readModel[methodProp].bind(readModel);
                            }
                        }
                        // Ejecutar métodos de escritura o utilidad en el cliente principal (primario)
                        const val = modelTarget[methodProp];
                        return typeof val === "function" ? val.bind(modelTarget) : val;
                    }
                });
            }
            // Por defecto, delegar métodos de utilidad ($connect, $disconnect, $executeRaw, etc.) al cliente core primario
            const coreClient = (0, exports.getPrismaCore)();
            // Manejo de transacciones distribuidas en el Proxy (Best-Effort en el primario para coherencia)
            if (prop === "$transaction") {
                return async (arg, options) => {
                    if (Array.isArray(arg)) {
                        const results = [];
                        for (const op of arg) {
                            results.push(await op);
                        }
                        return results;
                    }
                    if (typeof arg === "function") {
                        const txProxy = new Proxy({}, {
                            get(txTarget, txProp) {
                                if (typeof txProp === "symbol")
                                    return txTarget[txProp];
                                const getter = modelToClientGetter[txProp];
                                if (getter) {
                                    return getter()[txProp]; // Sin proxy de lectura, todo va al primario
                                }
                                return coreClient[txProp];
                            }
                        });
                        return await arg(txProxy);
                    }
                    return await coreClient.$transaction(arg, options);
                };
            }
            // Delegar llamadas a funciones nativas en el primario por defecto
            if (typeof coreClient[prop] === "function") {
                return (...args) => coreClient[prop](...args);
            }
            return coreClient[prop];
        }
    });
if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = exports.prisma;
}
__exportStar(require("./cache-helper"), exports);
exports.default = exports.prisma;
//# sourceMappingURL=index.js.map