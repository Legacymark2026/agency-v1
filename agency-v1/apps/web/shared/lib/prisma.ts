import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __prisma: any | undefined;
}

// Re-export standard Prisma objects for type-safety and compatibility
export { PrismaClient } from "@prisma/client";
export { Prisma } from "@prisma/client";
export type * from "@prisma/client";

const getRuntimeEnv = (key: string): string | undefined => {
  const dbEnv = (globalThis as any).__DB_ENV__;
  if (dbEnv && key in dbEnv) {
    return dbEnv[key];
  }

  if (typeof process !== "undefined" && process.env) {
    // Dynamic property access prevents Turbopack/Webpack from inlining env variables during next build.
    const envObj = process.env;
    return envObj[key];
  }
  return undefined;
};

// Write debug info directly to stderr to bypass Next.js removeConsole minification
const writeDebug = (msg: string) => {
  const g = typeof globalThis !== "undefined" ? (globalThis as any) : {};
  const p = g["process"];
  if (p && p.stderr) {
    p.stderr.write(`[PRISMA-DEBUG] ${msg}\n`);
  }
};

// Ensure DATABASE_URL is always defined in process.env at runtime to satisfy Prisma's schema validation.
// The actual connection URLs are passed via datasourceUrl in createClient(), so this value
// is only used as a Prisma schema validation placeholder when the real env var is missing.
const runtimeDbUrl = getRuntimeEnv("DATABASE_URL");
if (!runtimeDbUrl) {
  const fallback =
    getRuntimeEnv("CORE_DATABASE_URL") ||
    getRuntimeEnv("AUTH_DATABASE_URL") ||
    "postgresql://legacymark:legacymark_dev@pgbouncer:6432/legacymark_core?connection_limit=5&pgbouncer=true&sslmode=require";
  writeDebug(`DATABASE_URL is missing at startup! Setting fallback to: ${fallback.replace(/:[^:@]+@/, ":****@")}`);
  if (typeof process !== "undefined" && process.env) {
    process.env.DATABASE_URL = fallback;
  }
} else {
  writeDebug(`DATABASE_URL is defined at startup: ${runtimeDbUrl.replace(/:[^:@]+@/, ":****@")}`);
}

const logConfig =
  getRuntimeEnv("NODE_ENV") === "development"
    ? ["query", "error", "warn"]
    : ["error"];

// Lazy-loaded primary database client instances
let _prismaAuth: PrismaClient | null = null;
let _prismaCore: PrismaClient | null = null;
let _prismaMedia: PrismaClient | null = null;
let _prismaAnalytics: PrismaClient | null = null;

// Lazy-loaded read-replica database client instances
let _prismaAuthRead: PrismaClient | null = null;
let _prismaCoreRead: PrismaClient | null = null;
let _prismaMediaRead: PrismaClient | null = null;
let _prismaAnalyticsRead: PrismaClient | null = null;

const createClient = (url: string | undefined): PrismaClient => {
  let connectionUrl = url;

  writeDebug(`Creating PrismaClient with URL: ${connectionUrl ? connectionUrl.replace(/:[^:@]+@/, ":****@") : "undefined"}`);

  if (
    connectionUrl &&
    !connectionUrl.startsWith("prisma://") &&
    getRuntimeEnv("NODE_ENV") === "production" &&
    !connectionUrl.includes("connection_limit")
  ) {
    const separator = connectionUrl.includes("?") ? "&" : "?";
    connectionUrl = `${connectionUrl}${separator}connection_limit=5&pool_timeout=20`;
  }

  // Use datasourceUrl instead of datasources.db.url:
  // In Prisma v6, `datasources` still triggers schema env var validation
  // (checking env("DATABASE_URL") in schema.prisma) BEFORE applying the override,
  // throwing "Environment variable not found" even if a URL is provided.
  // `datasourceUrl` bypasses this validation entirely. We pick only datasourceUrl to avoid conflicts.
  return new PrismaClient({
    log: logConfig as any,
    ...(connectionUrl ? { datasourceUrl: connectionUrl } : {}),
  });
};

// Client getters for primary connections
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

// Client getters for read-replica connections (falling back to primary if replica URL not set)
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

// Model-to-database routing maps for primary write operations
const modelToClientGetter: Record<string, () => PrismaClient> = {
  // Auth & RBAC
  user: getPrismaAuth,
  userProfile: getPrismaAuth,
  account: getPrismaAuth,
  session: getPrismaAuth,
  verificationToken: getPrismaAuth,
  passwordResetToken: getPrismaAuth,
  roleConfig: getPrismaAuth,
  role: getPrismaAuth,
  permission: getPrismaAuth,
  rolePermission: getPrismaAuth,
  resourcePermission: getPrismaAuth,
  apiKey: getPrismaAuth,

  // Core & CRM
  company: getPrismaCore,
  companyUser: getPrismaCore,
  team: getPrismaCore,
  lead: getPrismaCore,
  deal: getPrismaCore,
  invoice: getPrismaCore,
  expense: getPrismaCore,
  servicePrice: getPrismaCore,
  kanbanProject: getPrismaCore,
  leadAssignmentRule: getPrismaCore,
  leadAssignmentRoundRobinState: getPrismaCore,
  affiliateProfile: getPrismaCore,
  commissionPlan: getPrismaCore,
  click: getPrismaCore,
  referral: getPrismaCore,
  payout: getPrismaCore,
  inboxMacro: getPrismaCore,
  emailTemplate: getPrismaCore,
  outboxEvent: getPrismaCore,

  // Media, AI & Workflows
  post: getPrismaMedia,
  category: getPrismaMedia,
  tag: getPrismaMedia,
  project: getPrismaMedia,
  projectCategory: getPrismaMedia,
  projectTag: getPrismaMedia,
  projectView: getPrismaMedia,
  workflow: getPrismaMedia,
  campaign: getPrismaMedia,
  socialPost: getPrismaMedia,
  aiAgent: getPrismaMedia,
  agentMemory: getPrismaMedia,
  comment: getPrismaMedia,
  commentLike: getPrismaMedia,
  postLike: getPrismaMedia,
  postSeries: getPrismaMedia,
  readingListItem: getPrismaMedia,
  newsletterSubscription: getPrismaMedia,

  // Analytics & Logs
  userActivityLog: getPrismaAnalytics,
  postView: getPrismaAnalytics,
  usageLog: getPrismaAnalytics,
  integrationLog: getPrismaAnalytics,
  notificationDeliveryLog: getPrismaAnalytics,
};

// Model-to-database routing maps for read-only operations
const modelToReadClientGetter: Record<string, () => PrismaClient> = {
  // Auth & RBAC
  user: getPrismaAuthRead,
  userProfile: getPrismaAuthRead,
  account: getPrismaAuthRead,
  session: getPrismaAuthRead,
  verificationToken: getPrismaAuthRead,
  passwordResetToken: getPrismaAuthRead,
  roleConfig: getPrismaAuthRead,
  role: getPrismaAuthRead,
  permission: getPrismaAuthRead,
  rolePermission: getPrismaAuthRead,
  resourcePermission: getPrismaAuthRead,
  apiKey: getPrismaAuthRead,

  // Core & CRM
  company: getPrismaCoreRead,
  companyUser: getPrismaCoreRead,
  team: getPrismaCoreRead,
  lead: getPrismaCoreRead,
  deal: getPrismaCoreRead,
  invoice: getPrismaCoreRead,
  expense: getPrismaCoreRead,
  servicePrice: getPrismaCoreRead,
  kanbanProject: getPrismaCoreRead,
  leadAssignmentRule: getPrismaCoreRead,
  leadAssignmentRoundRobinState: getPrismaCoreRead,
  affiliateProfile: getPrismaCoreRead,
  commissionPlan: getPrismaCoreRead,
  click: getPrismaCoreRead,
  referral: getPrismaCoreRead,
  payout: getPrismaCoreRead,
  inboxMacro: getPrismaCoreRead,
  emailTemplate: getPrismaCoreRead,
  outboxEvent: getPrismaCoreRead,

  // Media, AI & Workflows
  post: getPrismaMediaRead,
  category: getPrismaMediaRead,
  tag: getPrismaMediaRead,
  project: getPrismaMediaRead,
  projectCategory: getPrismaMediaRead,
  projectTag: getPrismaMediaRead,
  projectView: getPrismaMediaRead,
  workflow: getPrismaMediaRead,
  campaign: getPrismaMediaRead,
  socialPost: getPrismaMediaRead,
  aiAgent: getPrismaMediaRead,
  agentMemory: getPrismaMediaRead,
  comment: getPrismaMediaRead,
  commentLike: getPrismaMediaRead,
  postLike: getPrismaMediaRead,
  postSeries: getPrismaMediaRead,
  readingListItem: getPrismaMediaRead,
  newsletterSubscription: getPrismaMediaRead,

  // Analytics & Logs
  userActivityLog: getPrismaAnalyticsRead,
  postView: getPrismaAnalyticsRead,
  usageLog: getPrismaAnalyticsRead,
  integrationLog: getPrismaAnalyticsRead,
  notificationDeliveryLog: getPrismaAnalyticsRead,
};

/**
 * Proxy object wrapping all database access, intercepting queries
 * and delegating them to the corresponding logical database/replica.
 */
export const prisma =
  globalThis.__prisma ??
  new Proxy({} as any, {
    get(target, prop: string | symbol) {
      if (typeof prop === "symbol") return (target as any)[prop];

      // Route raw queries to the Core replica client by default
      if (prop === "$queryRaw" || prop === "$queryRawUnsafe") {
        const client = getPrismaCoreRead();
        return (...args: any[]) => (client as any)[prop](...args);
      }

      // Intercept accesses to registered models
      const clientGetter = modelToClientGetter[prop as string];
      if (clientGetter) {
        const primaryModel = clientGetter()[prop as any];

        // Return a proxy over the model to intercept and split reads vs writes
        return new Proxy(primaryModel, {
          get(modelTarget, methodProp: string | symbol) {
            const readMethods = ["findMany", "findUnique", "findFirst", "count", "aggregate", "groupBy", "findRaw", "aggregateRaw"];
            if (
              typeof methodProp === "string" &&
              readMethods.includes(methodProp)
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
            // Write operations or utilities execute on the primary client
            const val = (modelTarget as any)[methodProp];
            return typeof val === "function" ? val.bind(modelTarget) : val;
          }
        });
      }

      // Fallback for utility methods ($connect, $disconnect, etc.) routes to Core primary client
      const coreClient = getPrismaCore();

      // Transaction routing logic (runs transaction on the primary client)
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
                  return getter()[txProp as any]; // Execute on primary client inside transaction
                }
                return (coreClient as any)[txProp];
              }
            });
            return await arg(txProxy);
          }
          return await coreClient.$transaction(arg, options);
        };
      }

      if (typeof (coreClient as any)[prop] === "function") {
        return (...args: any[]) => (coreClient as any)[prop](...args);
      }

      return (coreClient as any)[prop];
    }
  });

if (getRuntimeEnv("NODE_ENV") !== "production") {
  globalThis.__prisma = prisma;
}
