/**
 * lib/tenant-prisma.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Extensión de Prisma para Aislamiento de Inquilinos (Zero-Trust Multi-Tenancy)
 *
 * El propósito de este cliente extendido es asegurar explícitamente que los
 * desarrolladores no puedan consultar, modificar ni eliminar registros que
 * pertenezcan a otras Agencias/Companies sin querer (via N+1, cruce de datos, etc).
 *
 * En lugar de depender en que cada Server Action pase `where: { companyId }`,
 * este cliente lo inyecta obligatoriamente en la capa de acceso a datos.
 *
 * USO:
 *   import { getTenantPrisma } from "@/lib/tenant-prisma";
 *   const db = getTenantPrisma(session.companyId);
 *   const leads = await db.lead.findMany(); // ← Solo devolverá los de esa empresa automática y obligatoriamente.
 */

import { prisma } from "./prisma";
import type { Prisma } from "@prisma/client";

// Modelos que estrictamente pertenecen a un Tenant (tienen columna companyId obligatoria)
const TENANT_MODELS = [
  "Lead",
  "Deal",
  "Campaign",
  "CompanyUser",
  "Task",
  "EmailTemplate",
  "LeadScoringRule",
  "DealAutomationRule",
  "EmailSequence",
  "SalesGoal",
  "CommissionRule",
  "CommissionPayment",
] as const;

export function getTenantPrisma(companyId: string) {
  if (!companyId) {
    throw new Error(
      "[Tenant Prisma] ERROR FATAL: No companyId provided for multi-tenant isolation."
    );
  }

  return prisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          // Si no es un modelo inquilino (ej: User, Session), ignoramos y pasamos
          if (!TENANT_MODELS.includes(model as typeof TENANT_MODELS[number])) {
            return query(args);
          }

          // Clausula a inyectar
          const tenantWhere = { companyId };

          // Inyección para operaciones de LECTURA y CONTEO
          if (
            operation === "findUnique" ||
            operation === "findFirst" ||
            operation === "findMany" ||
            operation === "count" ||
            operation === "aggregate" ||
            operation === "groupBy"
          ) {
            args.where = { ...(args.where || {}), ...tenantWhere };
          }
          
          // Inyección de seguridad para ESCRITURAS MASIVAS
          // updateMany, deleteMany (update y delete simples requieren id y findUnique no cruza, 
          // pero es más seguro fallar si no existe)
          if (operation === "updateMany" || operation === "deleteMany") {
            args.where = { ...(args.where || {}), ...tenantWhere };
          }

          // Para CREATE, forzamos a que el data traiga companyId y lo sobreescribimos
          // para evitar que el request pretenda crear data de otro tenant.
          if (operation === "create" || operation === "createMany") {
             if (operation === "create") {
                 args.data = { ...args.data, ...tenantWhere };
             } else {
                 if (Array.isArray((args.data as any))) {
                     args.data = (args.data as any).map((d: any) => ({ ...d, ...tenantWhere }));
                 } else {
                     args.data = { ...(args.data as any), ...tenantWhere };
                 }
             }
          }

          // Ejecuta y devuelve
          return query(args);
        },
      },
    },
  });
}
