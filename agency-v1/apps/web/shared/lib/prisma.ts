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
  const g = typeof globalThis !== "undefined" ? (globalThis as any) : {};
  const p = g["process"];
  if (p && p.env) {
    return p.env[key];
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
const runtimeDbUrl = getRuntimeEnv("DATABASE_URL");
if (!runtimeDbUrl) {
  const fallback =
    getRuntimeEnv("CORE_DATABASE_URL") ||
    getRuntimeEnv("AUTH_DATABASE_URL") ||
    "postgresql://legacyuser:dummy@localhost:5432/legacymark";
  writeDebug(`DATABASE_URL is missing at startup! Setting fallback to: ${fallback.replace(/:[^:@]+@/, ":****@")}`);
  const g = typeof globalThis !== "undefined" ? (globalThis as any) : {};
  const p = g["process"];
  if (p && p.env) {
    p.env.DATABASE_URL = fallback;
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
  if (!_prismaMediaRead) {
    _prismaMediaRead = createClient(
      getRuntimeEnv("MEDIA_DATABASE_READ_URL") ||
        getRuntimeEnv("DATABASE_READ_URL") ||
        getRuntimeEnv("MEDIA_DATABASE_URL") ||
        getRuntimeEnv("DATABASE_URL")
    );
  }
  return _prismaMediaRead;
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
  workflow: getPrismaMedia,
  campaign: getPrismaMedia,
  socialPost: getPrismaMedia,
  aiAgent: getPrismaMedia,
  agentMemory: getPrismaMedia,

  // Analytics & Logs
  userActivityLog: getPrismaAnalytics,
  projectView: getPrismaAnalytics,
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
  workflow: getPrismaMediaRead,
  campaign: getPrismaMediaRead,
  socialPost: getPrismaMediaRead,
  aiAgent: getPrismaMediaRead,
  agentMemory: getPrismaMediaRead,

  // Analytics & Logs
  userActivityLog: getPrismaAnalyticsRead,
  projectView: getPrismaAnalyticsRead,
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
                return (readModel as any)[methodProp].bind(readModel);
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
