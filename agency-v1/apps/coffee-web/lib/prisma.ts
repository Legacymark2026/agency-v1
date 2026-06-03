/**
 * Goldneez Coffee Web — Dedicated Prisma Client
 * ────────────────────────────────────────────────────────
 * Cliente Prisma exclusivo para coffee-web con inicialización LAZY.
 * No lanza errores al importar el módulo — solo al hacer queries.
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
  return (
    process.env.GOLDNEEZ_DB_URL ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_EXTERNAL_URL ||
    null
  );
}

function createPrismaClient(): PrismaClient {
  const url = getDbUrl();

  if (!url) {
    // Retorna un proxy que lanza un error descriptivo al intentar cualquier operación
    return new Proxy({} as PrismaClient, {
      get(_target, prop) {
        if (typeof prop === "symbol") return undefined;
        // Permitir métodos de inspección sin error
        if (prop === "then" || prop === "catch" || prop === "finally") return undefined;
        // Para cualquier operación de base de datos, lanzar error claro
        return () =>
          Promise.reject(
            new Error(
              "⚠️ Goldneez: Base de datos no configurada.\n" +
              "Agrega GOLDNEEZ_DB_URL en las variables de entorno de Vercel:\n" +
              "postgresql://user:pass@host:5432/legacymark?schema=goldneez&search_path=goldneez,public"
            )
          );
      },
    });
  }

  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
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
