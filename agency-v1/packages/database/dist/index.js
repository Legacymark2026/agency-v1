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
exports.getPrismaAnalytics = exports.getPrismaMedia = exports.getPrismaCore = exports.getPrismaAuth = exports.prisma = exports.getReplicaClient = exports.getPrimaryClient = exports.Prisma = exports.PrismaClient = exports.primaryDatabaseStorage = void 0;
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
let _primaryClient = null;
let _replicaClient = null;
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
        // Ensure a low pool_timeout to prevent infinite or long hangs
        const sep2 = connectionUrl.includes("?") ? "&" : "?";
        const poolTimeout = getRuntimeEnv('PRISMA_POOL_TIMEOUT') || '10';
        if (!connectionUrl.includes("pool_timeout")) {
            connectionUrl = `${connectionUrl}${sep2}pool_timeout=${poolTimeout}`;
        }
        else {
            connectionUrl = connectionUrl.replace(/pool_timeout=\d+/, `pool_timeout=${poolTimeout}`);
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
const getPrimaryClient = () => {
    if (!_primaryClient) {
        _primaryClient = createClient(getRuntimeEnv("DATABASE_URL"));
    }
    return _primaryClient;
};
exports.getPrimaryClient = getPrimaryClient;
const getReplicaClient = () => {
    if (!_replicaClient) {
        _replicaClient = createClient(getRuntimeEnv("DATABASE_READ_URL") || getRuntimeEnv("DATABASE_URL"));
    }
    return _replicaClient;
};
exports.getReplicaClient = getReplicaClient;
// Singleton global para Next.js hot-reload
const globalForPrisma = globalThis;
exports.prisma = globalForPrisma.prisma ??
    new Proxy({}, {
        get(target, prop) {
            if (typeof prop === "symbol")
                return target[prop];
            // Redirigir consultas de lectura cruda a la réplica (a menos que se fuerce lectura al primario)
            if (prop === "$queryRaw" || prop === "$queryRawUnsafe") {
                const client = exports.primaryDatabaseStorage.getStore() ? (0, exports.getPrimaryClient)() : (0, exports.getReplicaClient)();
                return (...args) => client[prop](...args);
            }
            // Interceptar accesos a propiedades de modelos
            if (typeof prop === "string" && prop[0] !== "$") {
                const primaryModel = (0, exports.getPrimaryClient)()[prop];
                if (primaryModel) {
                    // Retornar un proxy sobre el modelo para interceptar lecturas
                    return new Proxy(primaryModel, {
                        get(modelTarget, methodProp) {
                            const readMethods = ["findMany", "findUnique", "findFirst", "count", "aggregate", "groupBy", "findRaw", "aggregateRaw"];
                            if (typeof methodProp === "string" &&
                                readMethods.includes(methodProp) &&
                                !exports.primaryDatabaseStorage.getStore()) {
                                const readModel = (0, exports.getReplicaClient)()[prop];
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
                                            const fallbackPrimaryModel = (0, exports.getPrimaryClient)()[prop];
                                            return await fallbackPrimaryModel[methodProp](...args);
                                        }
                                        throw err;
                                    }
                                };
                            }
                            // Ejecutar métodos de escritura o utilidad en el cliente principal (primario)
                            const val = modelTarget[methodProp];
                            return typeof val === "function" ? val.bind(modelTarget) : val;
                        }
                    });
                }
            }
            const primaryClient = (0, exports.getPrimaryClient)();
            if (prop === "$transaction") {
                return (...args) => primaryClient.$transaction(...args);
            }
            // Delegar llamadas a funciones nativas en el primario por defecto
            if (typeof primaryClient[prop] === "function") {
                return (...args) => primaryClient[prop](...args);
            }
            return primaryClient[prop];
        }
    });
if (getRuntimeEnv("NODE_ENV") !== "production") {
    globalForPrisma.prisma = exports.prisma;
}
__exportStar(require("./cache-helper"), exports);
exports.default = exports.prisma;
// Legacy compatibility aliases for split-schema clients
const getPrismaAuth = () => exports.prisma;
exports.getPrismaAuth = getPrismaAuth;
const getPrismaCore = () => exports.prisma;
exports.getPrismaCore = getPrismaCore;
const getPrismaMedia = () => exports.prisma;
exports.getPrismaMedia = getPrismaMedia;
const getPrismaAnalytics = () => exports.prisma;
exports.getPrismaAnalytics = getPrismaAnalytics;
//# sourceMappingURL=index.js.map