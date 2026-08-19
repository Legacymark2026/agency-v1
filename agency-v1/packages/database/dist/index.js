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
const getRuntimeEnv = (key) => {
    const g = typeof globalThis !== "undefined" ? globalThis : {};
    const p = g["process"];
    if (p && p.env) {
        return p.env[key];
    }
    return undefined;
};
// Write debug info directly to stderr
const writeDebug = (msg) => {
    if (getRuntimeEnv("NODE_ENV") === "test")
        return;
    const g = typeof globalThis !== "undefined" ? globalThis : {};
    const p = g["process"];
    if (p && p.stderr) {
        p.stderr.write(`[PRISMA-DB-DEBUG] ${msg}\n`);
    }
};
const logConfig = getRuntimeEnv("NODE_ENV") === "test"
    ? []
    : getRuntimeEnv("NODE_ENV") === "development"
        ? ["query", "error", "warn"]
        : ["error"];
const createClient = (url) => {
    let connectionUrl = url;
    if (connectionUrl && !connectionUrl.startsWith("prisma://")) {
        const separator = connectionUrl.includes("?") ? "&" : "?";
        // Ensure connection_limit is set
        if (!connectionUrl.includes("connection_limit")) {
            connectionUrl = `${connectionUrl}${separator}connection_limit=5`;
        }
        // Ensure a low pool_timeout (3s) to prevent infinite or long hangs
        const sep2 = connectionUrl.includes("?") ? "&" : "?";
        if (!connectionUrl.includes("pool_timeout")) {
            connectionUrl = `${connectionUrl}${sep2}pool_timeout=3`;
        }
        else {
            connectionUrl = connectionUrl.replace(/pool_timeout=\d+/, "pool_timeout=3");
        }
        // Ensure a low connect_timeout (3s) to prevent infinite or long hangs
        const sep3 = connectionUrl.includes("?") ? "&" : "?";
        if (!connectionUrl.includes("connect_timeout")) {
            connectionUrl = `${connectionUrl}${sep3}connect_timeout=3`;
        }
        else {
            connectionUrl = connectionUrl.replace(/connect_timeout=\d+/, "connect_timeout=3");
        }
    }
    writeDebug(`Creating PrismaClient with URL: ${connectionUrl ? connectionUrl.replace(/:[^:@]+@/, ":****@") : "undefined"}`);
    // Use datasourceUrl instead of datasources.db.url to bypass schema env var validation
    return new client_1.PrismaClient({
        log: logConfig,
        ...(connectionUrl ? { datasourceUrl: connectionUrl } : {}),
    });
};
const getPrismaAuth = () => {
    if (!_prismaAuth) {
        _prismaAuth = createClient(getRuntimeEnv("AUTH_DATABASE_URL") || getRuntimeEnv("DATABASE_URL"));
    }
    return _prismaAuth;
};
exports.getPrismaAuth = getPrismaAuth;
const getPrismaCore = () => {
    if (!_prismaCore) {
        _prismaCore = createClient(getRuntimeEnv("CORE_DATABASE_URL") || getRuntimeEnv("DATABASE_URL"));
    }
    return _prismaCore;
};
exports.getPrismaCore = getPrismaCore;
const getPrismaMedia = () => {
    if (!_prismaMedia) {
        _prismaMedia = createClient(getRuntimeEnv("MEDIA_DATABASE_URL") || getRuntimeEnv("DATABASE_URL"));
    }
    return _prismaMedia;
};
exports.getPrismaMedia = getPrismaMedia;
const getPrismaAnalytics = () => {
    if (!_prismaAnalytics) {
        _prismaAnalytics = createClient(getRuntimeEnv("ANALYTICS_DATABASE_URL") || getRuntimeEnv("DATABASE_URL"));
    }
    return _prismaAnalytics;
};
exports.getPrismaAnalytics = getPrismaAnalytics;
// Getters de réplicas de lectura
const getPrismaAuthRead = () => {
    if (!_prismaAuthRead) {
        _prismaAuthRead = createClient(getRuntimeEnv("AUTH_DATABASE_READ_URL") ||
            getRuntimeEnv("DATABASE_READ_URL") ||
            getRuntimeEnv("AUTH_DATABASE_URL") ||
            getRuntimeEnv("DATABASE_URL"));
    }
    return _prismaAuthRead;
};
exports.getPrismaAuthRead = getPrismaAuthRead;
const getPrismaCoreRead = () => {
    if (!_prismaCoreRead) {
        _prismaCoreRead = createClient(getRuntimeEnv("CORE_DATABASE_READ_URL") ||
            getRuntimeEnv("DATABASE_READ_URL") ||
            getRuntimeEnv("CORE_DATABASE_URL") ||
            getRuntimeEnv("DATABASE_URL"));
    }
    return _prismaCoreRead;
};
exports.getPrismaCoreRead = getPrismaCoreRead;
const getPrismaMediaRead = () => {
    return (0, exports.getPrismaMedia)();
};
exports.getPrismaMediaRead = getPrismaMediaRead;
const getPrismaAnalyticsRead = () => {
    if (!_prismaAnalyticsRead) {
        _prismaAnalyticsRead = createClient(getRuntimeEnv("ANALYTICS_DATABASE_READ_URL") ||
            getRuntimeEnv("DATABASE_READ_URL") ||
            getRuntimeEnv("ANALYTICS_DATABASE_URL") ||
            getRuntimeEnv("DATABASE_URL"));
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
    projectCategory: exports.getPrismaMedia,
    projectTag: exports.getPrismaMedia,
    projectView: exports.getPrismaMedia,
    workflow: exports.getPrismaMedia,
    campaign: exports.getPrismaMedia,
    socialPost: exports.getPrismaMedia,
    aiAgent: exports.getPrismaMedia,
    agentMemory: exports.getPrismaMedia,
    comment: exports.getPrismaMedia,
    commentLike: exports.getPrismaMedia,
    postLike: exports.getPrismaMedia,
    postSeries: exports.getPrismaMedia,
    readingListItem: exports.getPrismaMedia,
    newsletterSubscription: exports.getPrismaMedia,
    // Analytics & Logs
    userActivityLog: exports.getPrismaAnalytics,
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
    projectCategory: exports.getPrismaMediaRead,
    projectTag: exports.getPrismaMediaRead,
    projectView: exports.getPrismaMediaRead,
    workflow: exports.getPrismaMediaRead,
    campaign: exports.getPrismaMediaRead,
    socialPost: exports.getPrismaMediaRead,
    aiAgent: exports.getPrismaMediaRead,
    agentMemory: exports.getPrismaMediaRead,
    comment: exports.getPrismaMediaRead,
    commentLike: exports.getPrismaMediaRead,
    postLike: exports.getPrismaMediaRead,
    postSeries: exports.getPrismaMediaRead,
    readingListItem: exports.getPrismaMediaRead,
    newsletterSubscription: exports.getPrismaMediaRead,
    // Analytics & Logs
    userActivityLog: exports.getPrismaAnalyticsRead,
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
                                return async (...args) => {
                                    try {
                                        return await readModel[methodProp](...args);
                                    }
                                    catch (err) {
                                        const isConnErr = err?.message?.includes("Can't reach database server") ||
                                            err?.message?.includes("pgbouncer-replica") ||
                                            err?.code === "P1001" ||
                                            err?.code === "P1002" ||
                                            err?.code === "ECONNREFUSED";
                                        if (isConnErr) {
                                            writeDebug(`⚠️ [Replica Fallback] Read replica failed: ${err.message}. Falling back to primary DB.`);
                                            const fallbackPrimaryModel = clientGetter()[prop];
                                            return await fallbackPrimaryModel[methodProp](...args);
                                        }
                                        throw err;
                                    }
                                };
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
if (getRuntimeEnv("NODE_ENV") !== "production") {
    globalForPrisma.prisma = exports.prisma;
}
__exportStar(require("./cache-helper"), exports);
exports.default = exports.prisma;
//# sourceMappingURL=index.js.map