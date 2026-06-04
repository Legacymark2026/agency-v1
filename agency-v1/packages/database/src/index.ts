import { PrismaClient } from "@prisma/client";

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

const logConfig = process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"];

export const getPrismaAuth = (): PrismaClient => {
  if (!_prismaAuth) {
    const url = process.env.AUTH_DATABASE_URL || process.env.DATABASE_URL;
    _prismaAuth = new PrismaClient({
      log: logConfig as any,
      datasources: url ? { db: { url } } : undefined,
    });
  }
  return _prismaAuth;
};

export const getPrismaCore = (): PrismaClient => {
  if (!_prismaCore) {
    const url = process.env.CORE_DATABASE_URL || process.env.DATABASE_URL;
    _prismaCore = new PrismaClient({
      log: logConfig as any,
      datasources: url ? { db: { url } } : undefined,
    });
  }
  return _prismaCore;
};

export const getPrismaMedia = (): PrismaClient => {
  if (!_prismaMedia) {
    const url = process.env.MEDIA_DATABASE_URL || process.env.DATABASE_URL;
    _prismaMedia = new PrismaClient({
      log: logConfig as any,
      datasources: url ? { db: { url } } : undefined,
    });
  }
  return _prismaMedia;
};

export const getPrismaAnalytics = (): PrismaClient => {
  if (!_prismaAnalytics) {
    const url = process.env.ANALYTICS_DATABASE_URL || process.env.DATABASE_URL;
    _prismaAnalytics = new PrismaClient({
      log: logConfig as any,
      datasources: url ? { db: { url } } : undefined,
    });
  }
  return _prismaAnalytics;
};

// Getters de réplicas de lectura
export const getPrismaAuthRead = (): PrismaClient => {
  if (!_prismaAuthRead) {
    const url = process.env.AUTH_DATABASE_READ_URL || process.env.DATABASE_READ_URL || process.env.AUTH_DATABASE_URL || process.env.DATABASE_URL;
    _prismaAuthRead = new PrismaClient({
      log: logConfig as any,
      datasources: url ? { db: { url } } : undefined,
    });
  }
  return _prismaAuthRead;
};

export const getPrismaCoreRead = (): PrismaClient => {
  if (!_prismaCoreRead) {
    const url = process.env.CORE_DATABASE_READ_URL || process.env.DATABASE_READ_URL || process.env.CORE_DATABASE_URL || process.env.DATABASE_URL;
    _prismaCoreRead = new PrismaClient({
      log: logConfig as any,
      datasources: url ? { db: { url } } : undefined,
    });
  }
  return _prismaCoreRead;
};

export const getPrismaMediaRead = (): PrismaClient => {
  if (!_prismaMediaRead) {
    const url = process.env.MEDIA_DATABASE_READ_URL || process.env.DATABASE_READ_URL || process.env.MEDIA_DATABASE_URL || process.env.DATABASE_URL;
    _prismaMediaRead = new PrismaClient({
      log: logConfig as any,
      datasources: url ? { db: { url } } : undefined,
    });
  }
  return _prismaMediaRead;
};

export const getPrismaAnalyticsRead = (): PrismaClient => {
  if (!_prismaAnalyticsRead) {
    const url = process.env.ANALYTICS_DATABASE_READ_URL || process.env.DATABASE_READ_URL || process.env.ANALYTICS_DATABASE_URL || process.env.DATABASE_URL;
    _prismaAnalyticsRead = new PrismaClient({
      log: logConfig as any,
      datasources: url ? { db: { url } } : undefined,
    });
  }
  return _prismaAnalyticsRead;
};

// Mapa para asociar cada modelo con su cliente primario
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

// Mapa para asociar cada modelo con su cliente de réplica de lectura
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

// Singleton global para Next.js hot-reload
const globalForPrisma = globalThis as unknown as {
  prisma: any;
};

export const prisma =
  globalForPrisma.prisma ??
  new Proxy({} as any, {
    get(target, prop: string | symbol) {
      if (typeof prop === "symbol") return (target as any)[prop];

      // Redirigir consultas de lectura cruda a la réplica
      if (prop === "$queryRaw" || prop === "$queryRawUnsafe") {
        const readCoreClient = getPrismaCoreRead();
        return (...args: any[]) => (readCoreClient as any)[prop](...args);
      }

      // Redirigir el acceso al modelo correspondiente si está mapeado
      const clientGetter = modelToClientGetter[prop as string];
      if (clientGetter) {
        const primaryModel = clientGetter()[prop as any];

        // Retornar un proxy sobre el modelo para interceptar lecturas
        return new Proxy(primaryModel, {
          get(modelTarget, methodProp: string | symbol) {
            const readMethods = ["findMany", "findUnique", "findFirst", "count", "aggregate", "groupBy", "findRaw", "aggregateRaw"];
            if (typeof methodProp === "string" && readMethods.includes(methodProp)) {
              const readClientGetter = modelToReadClientGetter[prop as string];
              if (readClientGetter) {
                const readModel = readClientGetter()[prop as any];
                return (readModel as any)[methodProp].bind(readModel);
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

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export * from "./cache-helper";
export default prisma;
