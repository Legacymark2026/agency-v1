import { PrismaClient } from "@prisma/client";

/**
 * shared/lib/prisma.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Singleton de Prisma Client optimizado para entornos serverless.
 *
 * PROBLEMAS RESUELTOS:
 * 1. Hot-reload en dev: reutiliza la instancia via globalThis para evitar
 *    "Too many Prisma Client instances" en desarrollo.
 * 2. Connection pooling en producción: si POSTGRES_PRISMA_URL (PgBouncer) o
 *    DATABASE_URL con parámetros de pool está configurado, Prisma lo usa
 *    automáticamente. Recomendamos activar Prisma Accelerate o PgBouncer
 *    en modo transaction para serverless (Vercel).
 *
 * CONFIGURACIÓN RECOMENDADA PARA PRODUCCIÓN:
 * - Opción A (Prisma Accelerate): Cambiar DATABASE_URL por la URL de Accelerate
 *   DATABASE_URL="prisma://accelerate.prisma-data.net/?api_key=..."
 * - Opción B (PgBouncer): Agregar parámetros a la URL:
 *   DATABASE_URL="postgresql://...?pgbouncer=true&connection_limit=1&pool_timeout=20"
 *
 * @see https://www.prisma.io/docs/guides/performance-and-optimization/connection-management
 */

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "warn", "error"]
        : ["error"],
    // Para serverless: limitar el connection pool para no saturar max_connections.
    // Cuando se active Prisma Accelerate, estas opciones pasan a ser manejadas
    // por el proxy y se pueden eliminar.
    datasources: {
      db: {
        url: process.env.POSTGRES_PRISMA_URL ?? process.env.DATABASE_URL!,
      },
    },
  });
}

// Singleton pattern: una sola instancia compartida en dev (evita N instancias en hot-reload)
// En producción, Vercel crea una función por deploy — el singleton vive mientras la función esté caliente.
export const prisma = globalThis.__prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma = prisma;
}
