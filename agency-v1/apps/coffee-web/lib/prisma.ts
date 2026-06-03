/**
 * Goldneez Coffee Web — Dedicated Prisma Client
 * ────────────────────────────────────────────────────────
 * Cliente Prisma exclusivo para coffee-web con inicialización LAZY.
 *
 * Prioridad de variable de entorno (de mayor a menor):
 *   1. GOLDNEEZ_DB_URL  → Variable específica para Vercel/producción
 *   2. DATABASE_URL     → Variable del .env local de coffee-web
 *   3. POSTGRES_EXTERNAL_URL → Fallback de compatibilidad
 */

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  goldneezPrisma: PrismaClient | undefined;
};

function getDbUrl(): string | null {
  const url =
    process.env.GOLDNEEZ_DB_URL ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_EXTERNAL_URL ||
    null;

  // Rechazar strings vacíos
  return url && url.trim().length > 10 ? url : null;
}

const DB_NOT_CONFIGURED_MSG =
  "⚠️ Goldneez: Base de datos no configurada en Vercel. " +
  "Agrega la variable GOLDNEEZ_DB_URL en Settings → Environment Variables de tu proyecto en Vercel.";

/**
 * Crea un Proxy que devuelve errores descriptivos para TODOS los métodos
 * de Prisma (prisma.user.findUnique, prisma.user.create, etc.)
 * sin crashear al importar el módulo.
 */
function createNotConfiguredProxy(): PrismaClient {
  const methodProxy = () =>
    new Proxy(
      {},
      {
        get(_t, methodName) {
          if (typeof methodName === "symbol") return undefined;
          // Métodos reales de Prisma: findUnique, findMany, create, update, delete, etc.
          return (..._args: any[]) =>
            Promise.reject(new Error(DB_NOT_CONFIGURED_MSG));
        },
      }
    );

  return new Proxy({} as PrismaClient, {
    get(_target, prop) {
      if (typeof prop === "symbol") return undefined;
      // Evitar que sea tratado como Promise
      if (prop === "then" || prop === "catch" || prop === "finally") return undefined;
      // $connect, $disconnect, $queryRaw etc.
      if (String(prop).startsWith("$")) {
        return (..._args: any[]) => Promise.reject(new Error(DB_NOT_CONFIGURED_MSG));
      }
      // Accesos a modelos: prisma.user, prisma.session, etc.
      // Devuelve un objeto con todos los métodos de modelo como promesas rechazadas
      return methodProxy();
    },
  });
}

function createPrismaClient(): PrismaClient {
  const url = getDbUrl();

  if (!url) {
    console.error(
      "[coffee-web] " + DB_NOT_CONFIGURED_MSG
    );
    return createNotConfiguredProxy();
  }

  return new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
    datasources: {
      db: { url },
    },
  });
}

export const prismaGoldneez: PrismaClient =
  globalForPrisma.goldneezPrisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.goldneezPrisma = prismaGoldneez;
}

export default prismaGoldneez;
