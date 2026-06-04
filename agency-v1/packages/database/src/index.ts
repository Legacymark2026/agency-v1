/**
 * @agency/database — Shared Database Package
 * ─────────────────────────────────────────────────────────────────────────────
 * Central Prisma client and type exports for all microservices.
 * 
 * Usage in any service:
 *   import { prisma, Prisma } from "@agency/database";
 */

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

// Mapa para asociar cada modelo con su cliente de base de datos específico
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

// Singleton global para Next.js hot-reload
const globalForPrisma = globalThis as unknown as {
  prisma: any;
};

export const prisma =
  globalForPrisma.prisma ??
  new Proxy({} as any, {
    get(target, prop: string | symbol) {
      if (typeof prop === "symbol") return (target as any)[prop];

      // Redirigir el acceso al modelo correspondiente si está mapeado
      const clientGetter = modelToClientGetter[prop as string];
      if (clientGetter) {
        return clientGetter()[prop as any];
      }

      // Por defecto, delegar métodos de utilidad ($queryRaw, $connect, etc.) al cliente core
      const coreClient = getPrismaCore();

      // Manejo de transacciones distribuidas en el Proxy (Best-Effort)
      if (prop === "$transaction") {
        return async (arg: any, options?: any) => {
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
            const txProxy = new Proxy({} as any, {
              get(txTarget, txProp: string | symbol) {
                if (typeof txProp === "symbol") return (txTarget as any)[txProp];
                const getter = modelToClientGetter[txProp as string];
                if (getter) {
                  return getter()[txProp as any];
                }
                return (coreClient as any)[txProp];
              }
            });
            return await arg(txProxy);
          }
          return await coreClient.$transaction(arg, options);
        };
      }

      // Delegar llamadas a funciones nativas ($queryRaw, $executeRaw, etc.)
      if (typeof (coreClient as any)[prop] === "function") {
        return (...args: any[]) => (coreClient as any)[prop](...args);
      }

      return (coreClient as any)[prop];
    }
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
