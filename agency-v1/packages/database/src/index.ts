import { PrismaClient } from "@prisma/client";
import { AsyncLocalStorage } from "async_hooks";

export const primaryDatabaseStorage = new AsyncLocalStorage<boolean>();

export function runInPrimary<T>(fn: () => Promise<T>): Promise<T> {
  return primaryDatabaseStorage.run(true, fn);
}

// Re-export everything from the main Prisma Client for type safety and backward compatibility
export { PrismaClient } from "@prisma/client";
export { Prisma } from "@prisma/client";
export type * from "@prisma/client";

let _primaryClient: PrismaClient | null = null;
let _replicaClient: PrismaClient | null = null;

const getRuntimeEnv = (key: string): string | undefined => {
  const g = typeof globalThis !== "undefined" ? (globalThis as any) : {};
  const p = g["process"];
  if (p && p.env) {
    return p.env[key];
  }
  return undefined;
};

// Write debug info directly to stderr
const writeDebug = (msg: string) => {
  if (getRuntimeEnv("NODE_ENV") === "test") return;
  const g = typeof globalThis !== "undefined" ? (globalThis as any) : {};
  const p = g["process"];
  if (p && p.stderr) {
    p.stderr.write(`[PRISMA-DB-DEBUG] ${msg}\n`);
  }
};

const logConfig =
  getRuntimeEnv("NODE_ENV") === "test"
    ? []
    : getRuntimeEnv("NODE_ENV") === "development"
    ? ["query", "error", "warn"]
    : ["error"];

const createClient = (url: string | undefined): PrismaClient => {
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
    } else {
      connectionUrl = connectionUrl.replace(/pool_timeout=\d+/, `pool_timeout=${poolTimeout}`);
    }
    
    // Ensure a low connect_timeout (3s) to prevent infinite or long hangs
    const sep3 = connectionUrl.includes("?") ? "&" : "?";
    if (!connectionUrl.includes("connect_timeout")) {
      connectionUrl = `${connectionUrl}${sep3}connect_timeout=3`;
    } else {
      connectionUrl = connectionUrl.replace(/connect_timeout=\d+/, "connect_timeout=3");
    }
  }

  writeDebug(`Creating PrismaClient with URL: ${connectionUrl ? connectionUrl.replace(/:[^:@]+@/, ":****@") : "undefined"}`);

  // Use datasourceUrl instead of datasources.db.url to bypass schema env var validation
  return new PrismaClient({
    log: logConfig as any,
    ...(connectionUrl ? { datasourceUrl: connectionUrl } : {}),
  });
};

export const getPrimaryClient = (): PrismaClient => {
  if (!_primaryClient) {
    _primaryClient = createClient(getRuntimeEnv("DATABASE_URL"));
  }
  return _primaryClient;
};

export const getReplicaClient = (): PrismaClient => {
  if (!_replicaClient) {
    _replicaClient = createClient(getRuntimeEnv("DATABASE_READ_URL") || getRuntimeEnv("DATABASE_URL"));
  }
  return _replicaClient;
};

// Singleton global para Next.js hot-reload
const globalForPrisma = globalThis as unknown as {
  prisma: any;
};

export const prisma =
  globalForPrisma.prisma ??
  new Proxy({} as any, {
    get(target, prop: string | symbol) {
      if (typeof prop === "symbol") return (target as any)[prop];

      // Redirigir consultas de lectura cruda a la réplica (a menos que se fuerce lectura al primario)
      if (prop === "$queryRaw" || prop === "$queryRawUnsafe") {
        const client = primaryDatabaseStorage.getStore() ? getPrimaryClient() : getReplicaClient();
        return (...args: any[]) => (client as any)[prop](...args);
      }

      // Interceptar accesos a propiedades de modelos
      if (typeof prop === "string" && prop[0] !== "$") {
        const primaryModel = getPrimaryClient()[prop as keyof PrismaClient];
        
        if (primaryModel) {
          // Retornar un proxy sobre el modelo para interceptar lecturas
          return new Proxy(primaryModel as any, {
            get(modelTarget, methodProp: string | symbol) {
              const readMethods = ["findMany", "findUnique", "findFirst", "count", "aggregate", "groupBy", "findRaw", "aggregateRaw"];
              if (
                typeof methodProp === "string" && 
                readMethods.includes(methodProp) &&
                !primaryDatabaseStorage.getStore()
              ) {
                const readModel = getReplicaClient()[prop as keyof PrismaClient];
                return async (...args: any[]) => {
                  try {
                    return await (readModel as any)[methodProp](...args);
                  } catch (err: any) {
                    const isConnErr =
                      err?.message?.includes("Can't reach database server") ||
                      err?.message?.includes("pgbouncer-replica") ||
                      err?.code === "P1001" ||
                      err?.code === "P1002" ||
                      err?.code === "ECONNREFUSED";

                    if (isConnErr) {
                      writeDebug(`⚠️ [Replica Fallback] Read replica failed: ${err.message}. Falling back to primary DB.`);
                      const fallbackPrimaryModel = getPrimaryClient()[prop as keyof PrismaClient];
                      return await (fallbackPrimaryModel as any)[methodProp](...args);
                    }
                    throw err;
                  }
                };
              }
              // Ejecutar métodos de escritura o utilidad en el cliente principal (primario)
              const val = (modelTarget as any)[methodProp];
              return typeof val === "function" ? val.bind(modelTarget) : val;
            }
          });
        }
      }

      const primaryClient = getPrimaryClient();

      if (prop === "$transaction") {
        return (...args: any[]) => (primaryClient as any).$transaction(...args);
      }

      // Delegar llamadas a funciones nativas en el primario por defecto
      if (typeof (primaryClient as any)[prop] === "function") {
        return (...args: any[]) => (primaryClient as any)[prop](...args);
      }

      return (primaryClient as any)[prop];
    }
  });

if (getRuntimeEnv("NODE_ENV") !== "production") {
  globalForPrisma.prisma = prisma;
}

export * from "./cache-helper";
export default prisma;

// Legacy compatibility aliases for split-schema clients
export const getPrismaAuth = () => prisma;
export const getPrismaCore = () => prisma;
export const getPrismaMedia = () => prisma;
export const getPrismaAnalytics = () => prisma;
