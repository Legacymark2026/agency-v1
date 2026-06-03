/**
 * Goldneez Coffee Web — Dedicated Prisma Client
 * ────────────────────────────────────────────────────────
 * Cliente Prisma exclusivo para coffee-web.
 * Prioridad de variable de entorno (de mayor a menor):
 *   1. GOLDNEEZ_DB_URL  → Variable específica para Vercel/producción
 *   2. DATABASE_URL     → Variable del .env local de coffee-web
 *   3. POSTGRES_EXTERNAL_URL → Fallback de compatibilidad
 *
 * La URL debe apuntar al schema 'goldneez' aislado:
 * postgresql://user:pass@host:5432/legacymark?schema=goldneez&search_path=goldneez,public
 */

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  goldneezPrisma: PrismaClient | undefined;
};

// Prioridad: GOLDNEEZ_DB_URL > DATABASE_URL > POSTGRES_EXTERNAL_URL
const DATABASE_URL =
  process.env.GOLDNEEZ_DB_URL ||
  process.env.DATABASE_URL ||
  process.env.POSTGRES_EXTERNAL_URL;

if (!DATABASE_URL) {
  throw new Error(
    "[coffee-web] Error de configuración: No se encontró ninguna variable de base de datos. " +
    "Configura GOLDNEEZ_DB_URL en las variables de entorno de Vercel con la URL del schema goldneez:\n" +
    "postgresql://user:pass@host:5432/legacymark?schema=goldneez&search_path=goldneez,public"
  );
}

export const prismaGoldneez: PrismaClient =
  globalForPrisma.goldneezPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    datasources: {
      db: {
        url: DATABASE_URL,
      },
    },
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.goldneezPrisma = prismaGoldneez;
}

export default prismaGoldneez;
