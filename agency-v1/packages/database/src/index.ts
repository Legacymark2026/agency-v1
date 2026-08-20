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

// Instancias de singleton cargadas de manera perezosa (lazy)
let _prismaAuth: PrismaClient | null = null;
let _prismaCore: PrismaClient | null = null;
let _prismaMedia: PrismaClient | null = null;
let _prismaAnalytics: PrismaClient | null = null;

// Instancias de réplica de lectura
let _prismaAuthRead: PrismaClient | null = null;
let _prismaCoreRead: PrismaClient | null = null;
let _prismaMediaRead: PrismaClient | null = null;
let _prismaAnalyticsRead: PrismaClient | null = null;

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
    
    // Ensure a low pool_timeout (3s) to prevent infinite or long hangs
    const sep2 = connectionUrl.includes("?") ? "&" : "?";
    if (!connectionUrl.includes("pool_timeout")) {
      connectionUrl = `${connectionUrl}${sep2}pool_timeout=3`;
    } else {
      connectionUrl = connectionUrl.replace(/pool_timeout=\d+/, "pool_timeout=3");
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

export const getPrismaAuth = (): PrismaClient => {
  if (!_prismaAuth) {
    _prismaAuth = createClient(
      getRuntimeEnv("AUTH_DATABASE_URL") || getRuntimeEnv("DATABASE_URL")
    );
  }
  return _prismaAuth;
};

export const getPrismaCore = (): PrismaClient => {
  if (!_prismaCore) {
    _prismaCore = createClient(
      getRuntimeEnv("CORE_DATABASE_URL") || getRuntimeEnv("DATABASE_URL")
    );
  }
  return _prismaCore;
};

export const getPrismaMedia = (): PrismaClient => {
  if (!_prismaMedia) {
    _prismaMedia = createClient(
      getRuntimeEnv("MEDIA_DATABASE_URL") || getRuntimeEnv("DATABASE_URL")
    );
  }
  return _prismaMedia;
};

export const getPrismaAnalytics = (): PrismaClient => {
  if (!_prismaAnalytics) {
    _prismaAnalytics = createClient(
      getRuntimeEnv("ANALYTICS_DATABASE_URL") || getRuntimeEnv("DATABASE_URL")
    );
  }
  return _prismaAnalytics;
};

// Getters de réplicas de lectura
export const getPrismaAuthRead = (): PrismaClient => {
  if (!_prismaAuthRead) {
    _prismaAuthRead = createClient(
      getRuntimeEnv("AUTH_DATABASE_READ_URL") ||
        getRuntimeEnv("DATABASE_READ_URL") ||
        getRuntimeEnv("AUTH_DATABASE_URL") ||
        getRuntimeEnv("DATABASE_URL")
    );
  }
  return _prismaAuthRead;
};

export const getPrismaCoreRead = (): PrismaClient => {
  if (!_prismaCoreRead) {
    _prismaCoreRead = createClient(
      getRuntimeEnv("CORE_DATABASE_READ_URL") ||
        getRuntimeEnv("DATABASE_READ_URL") ||
        getRuntimeEnv("CORE_DATABASE_URL") ||
        getRuntimeEnv("DATABASE_URL")
    );
  }
  return _prismaCoreRead;
};

export const getPrismaMediaRead = (): PrismaClient => {
  return getPrismaMedia();
};

export const getPrismaAnalyticsRead = (): PrismaClient => {
  if (!_prismaAnalyticsRead) {
    _prismaAnalyticsRead = createClient(
      getRuntimeEnv("ANALYTICS_DATABASE_READ_URL") ||
        getRuntimeEnv("DATABASE_READ_URL") ||
        getRuntimeEnv("ANALYTICS_DATABASE_URL") ||
        getRuntimeEnv("DATABASE_URL")
    );
  }
  return _prismaAnalyticsRead;
};

// Dynamic Model Routing Lists based on domain split
const authModelsList = [
  "user", "userProfile", "account", "session", "verificationToken", "passwordResetToken",
  "roleConfig", "role", "permission", "rolePermission", "resourcePermission", "apiKey", "authRefreshToken"
];

const analyticsModelsList = [
  "userActivityLog", "projectView", "postView", "usageLog", "integrationLog", "notificationDeliveryLog",
  "analyticsEvent", "analyticsSession", "analyticsGoal", "analyticsDailyStats"
];

const mediaModelsList = [
  "post", "category", "tag", "project", "projectCategory", "projectTag",
  "workflow", "campaign", "socialPost", "aiAgent", "agentMemory", "comment", "commentLike",
  "postLike", "postSeries", "readingListItem", "newsletterSubscription", "expert", "experiment",
  "annotation", "agentConversation", "agentMessage", "agentConfig", "agentSpecialization",
  "agentSkill", "skillTemplate", "agentConfigurationPreset", "agentSkillChain", "agentTeam",
  "agentTeamMember", "agentTeamRun", "videoEditorProject", "videoAISession", "videoAIMessage",
  "videoEditHistory", "editProposal", "editConflict", "versionSnapshot", "aiCorrection",
  "videoComment", "autoCaption", "exportJob", "brandStyle", "assetCatalog", "mlCompanyWeights",
  "videoPerformanceLog", "aiAuditLog", "mediaAsset", "videoRenderJob", "assetAnnotation",
  "assetCollection", "assetCollectionItem", "assetVersion"
];

const modelToClientGetter: Record<string, () => PrismaClient> = {};
const modelToReadClientGetter: Record<string, () => PrismaClient> = {};

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
        const client = primaryDatabaseStorage.getStore() ? getPrismaCore() : getPrismaCoreRead();
        return (...args: any[]) => (client as any)[prop](...args);
      }

      // Interceptar accesos a propiedades de modelos y registrarlos dinámicamente si es necesario
      if (typeof prop === "string" && prop[0] !== "$" && !modelToClientGetter[prop]) {
        if (authModelsList.includes(prop)) {
          modelToClientGetter[prop] = getPrismaAuth;
          modelToReadClientGetter[prop] = getPrismaAuthRead;
        } else if (analyticsModelsList.includes(prop)) {
          modelToClientGetter[prop] = getPrismaAnalytics;
          modelToReadClientGetter[prop] = getPrismaAnalyticsRead;
        } else if (mediaModelsList.includes(prop)) {
          modelToClientGetter[prop] = getPrismaMedia;
          modelToReadClientGetter[prop] = getPrismaMediaRead;
        } else {
          // Por defecto todo lo demás va a Core (CRM, Finance, Kanban, etc.)
          modelToClientGetter[prop] = getPrismaCore;
          modelToReadClientGetter[prop] = getPrismaCoreRead;
        }
      }

      // Redirigir el acceso al modelo correspondiente si está mapeado
      const clientGetter = modelToClientGetter[prop as string];
      if (clientGetter) {
        const primaryModel = clientGetter()[prop as any];

        // Retornar un proxy sobre el modelo para interceptar lecturas
        return new Proxy(primaryModel, {
          get(modelTarget, methodProp: string | symbol) {
            const readMethods = ["findMany", "findUnique", "findFirst", "count", "aggregate", "groupBy", "findRaw", "aggregateRaw"];
            if (
              typeof methodProp === "string" && 
              readMethods.includes(methodProp) &&
              !primaryDatabaseStorage.getStore()
            ) {
              const readClientGetter = modelToReadClientGetter[prop as string];
              if (readClientGetter) {
                const readModel = readClientGetter()[prop as any];
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
                      const fallbackPrimaryModel = clientGetter()[prop as any];
                      return await (fallbackPrimaryModel as any)[methodProp](...args);
                    }
                    throw err;
                  }
                };
              }
            }
            // Ejecutar métodos de escritura o utilidad en el cliente principal (primario)
            const val = (modelTarget as any)[methodProp];
            return typeof val === "function" ? val.bind(modelTarget) : val;
          }
        });
      }

      // Por defecto, delegar métodos de utilidad ($connect, $disconnect, $executeRaw, etc.) al cliente core primario
      const coreClient = getPrismaCore();

      // Manejo de transacciones distribuidas en el Proxy (Best-Effort en el primario para coherencia)
      if (prop === "$transaction") {
        return async (arg: any, options?: any) => {
          if (Array.isArray(arg)) {
            const results = [];
            for (const op of arg) {
              results.push(await op);
            }
            return results;
          }
          if (typeof arg === "function") {
            const txProxy = new Proxy({} as any, {
              get(txTarget, txProp: string | symbol) {
                if (typeof txProp === "symbol") return (txTarget as any)[txProp];
                const getter = modelToClientGetter[txProp as string];
                if (getter) {
                  return getter()[txProp as any]; // Sin proxy de lectura, todo va al primario
                }
                return (coreClient as any)[txProp];
              }
            });
            return await arg(txProxy);
          }
          return await coreClient.$transaction(arg, options);
        };
      }

      // Delegar llamadas a funciones nativas en el primario por defecto
      if (typeof (coreClient as any)[prop] === "function") {
        return (...args: any[]) => (coreClient as any)[prop](...args);
      }

      return (coreClient as any)[prop];
    }
  });

if (getRuntimeEnv("NODE_ENV") !== "production") {
  globalForPrisma.prisma = prisma;
}

export * from "./cache-helper";
export default prisma;
