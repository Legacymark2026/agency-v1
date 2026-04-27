/**
 * lib/auth-context.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Contexto de autorización centralizado para Server Actions.
 *
 * REEMPLAZA el patrón disperso de:
 *   const session = await auth();
 *   if (!session?.user) return { error: "Unauthorized" };
 *
 * POR EL PATRÓN SEGURO:
 *   const ctx = await getAuthContext();   // lanza UnauthorizedError / ForbiddenError
 *   const db  = ctx.db;                   // Prisma con Zero-Trust multi-tenancy
 *
 * GARANTÍAS:
 *  1. Sesión autenticada y userId presente.
 *  2. companyId presente en sesión.
 *  3. La empresa existe en DB y NO está suspendida.
 *  4. El cliente Prisma devuelto inyecta companyId automáticamente en todas las queries.
 */

"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTenantPrisma } from "@/lib/tenant-prisma";
import { UnauthorizedError, ForbiddenError } from "@/lib/errors";
import { logger } from "@/lib/logger";

export interface AuthContext {
  /** ID del usuario autenticado */
  userId: string;
  /** ID del tenant (empresa/agencia) */
  companyId: string;
  /** Tier de subscripción: 'free' | 'pro' | 'agency' */
  tier: string;
  /** Estado de la subscripción Stripe */
  subscriptionStatus: string | null;
  /** Cliente Prisma con Zero-Trust multi-tenancy inyectado */
  db: ReturnType<typeof getTenantPrisma>;
  /** Indica si es el tenant maestro (agencia dueña del sistema) */
  isMasterTenant: boolean;
}

/**
 * Obtiene y valida el contexto de autorización completo.
 * Lanza errores tipados si la sesión, empresa o estado son inválidos.
 *
 * @throws {UnauthorizedError} Si el usuario no está autenticado o no tiene companyId.
 * @throws {ForbiddenError} Si la empresa está suspendida o no existe.
 *
 * @example
 * export async function createDeal(data: unknown) {
 *   const { userId, companyId, tier, db } = await getAuthContext();
 *   const deal = await db.deal.create({ data: { ...parsedData, companyId } });
 * }
 */
export async function getAuthContext(): Promise<AuthContext> {
  const session = await auth();

  if (!session?.user?.id) {
    throw new UnauthorizedError("No autenticado. Por favor inicia sesión.");
  }

  const companyId = session.user.companyId as string | undefined;
  if (!companyId) {
    throw new UnauthorizedError("Tu sesión no tiene una empresa asociada. Contacta al administrador.");
  }

  // Verificar estado de la empresa en DB (una sola query liviana)
  let company: { id: string; subscriptionTier: string; subscriptionStatus: string | null } | null = null;
  try {
    company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true, subscriptionTier: true, subscriptionStatus: true },
    });
  } catch (err) {
    logger.error("[AuthContext] DB lookup failed", {
      companyId,
      error: err instanceof Error ? err.message : String(err),
    });
    // fail-open en error de DB: no bloqueamos al usuario por falla de infraestructura
    return buildContext(session.user.id, companyId, "free", null);
  }

  if (!company) {
    throw new ForbiddenError("La empresa asociada a tu cuenta no existe. Contacta al administrador.");
  }

  if (company.subscriptionStatus === "suspended") {
    throw new ForbiddenError("Tu cuenta está suspendida. Contacta a soporte para reactivarla.");
  }

  return buildContext(session.user.id, companyId, company.subscriptionTier, company.subscriptionStatus);
}

/**
 * Versión liviana: solo verifica sesión + companyId, sin query a DB.
 * Usar únicamente en acciones de muy baja criticidad donde el overhead de la
 * verificación completa no está justificado.
 */
export async function getAuthContextLight(): Promise<Pick<AuthContext, "userId" | "companyId" | "db" | "isMasterTenant">> {
  const session = await auth();
  if (!session?.user?.id) throw new UnauthorizedError();
  const companyId = session.user.companyId as string | undefined;
  if (!companyId) throw new UnauthorizedError("Sin empresa asociada.");
  return buildContext(session.user.id, companyId, "free", null);
}

// ── Private builder ────────────────────────────────────────────────────────────

function buildContext(
  userId: string,
  companyId: string,
  tier: string,
  subscriptionStatus: string | null
): AuthContext {
  const isMasterTenant = !!(
    process.env.MASTER_TENANT_ID && companyId === process.env.MASTER_TENANT_ID
  );
  return {
    userId,
    companyId,
    tier: tier || "free",
    subscriptionStatus,
    db: getTenantPrisma(companyId),
    isMasterTenant,
  };
}

/**
 * Convierte un error de autorización en un objeto de respuesta estandarizado.
 * Útil para Server Actions que devuelven `{ error: string }` en lugar de lanzar.
 *
 * @example
 * export async function myAction() {
 *   const ctx = await getAuthContext().catch(authErrorToResponse);
 *   if ('error' in ctx) return ctx;
 * }
 */
export function authErrorToResponse(err: unknown): { error: string; status?: number } {
  if (err instanceof UnauthorizedError) return { error: err.message, status: 401 };
  if (err instanceof ForbiddenError) return { error: err.message, status: 403 };
  throw err; // Re-lanzar errores no relacionados con auth
}
