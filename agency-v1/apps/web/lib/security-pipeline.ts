"use server";

/**
 * lib/security-pipeline.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * PIPELINE SECUENCIAL DE SEGURIDAD Y CONTROL DE ACCESO (5 MOTORES SAAS)
 *
 * Flujo estricto ordenado:
 *   1. Motor de Autenticación (Auth Engine)
 *      Valida identidad, estado activo y sesión del usuario en Auth DB.
 *   2. Motor de Suscripción (Subscription Engine)
 *      Consulta el tier del tenant (free, starter, pro, enterprise) y vigencia del plan.
 *   3. Motor de Facturación (Billing Engine)
 *      Verifica solvencia comercial, estado de pagos e invoices vencidas sin mora bloqueante.
 *   4. Motor de Políticas Centralizadas (Centralized Policy Engine / PDP)
 *      Aplica el límite de aislamiento multi-tenant, zero-trust boundary, gobierno y reglas ABAC/PBAC.
 *   5. Motor de Autorización (Authorization Engine / RBAC & ABAC Granular)
 *      Resuelve permisos granulares, delegaciones del administrador y roles por módulo.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { prisma } from "@/lib/prisma";
import { ForbiddenError, UnauthorizedError } from "./errors";
import { logger } from "@/lib/logger";
import { GLOBAL_SUPERADMIN_EMAILS } from "@/auth.config";

export interface SecurityPipelineContext {
  userId: string;
  companyId?: string;
  permission?: string;
  requiredTier?: "free" | "starter" | "pro" | "enterprise";
  resourceType?: string;
  resourceId?: string;
  action?: string;
  allowGracePeriod?: boolean;
}

export interface SecurityPipelineResult {
  allowed: boolean;
  stage: "auth" | "subscription" | "billing" | "policy" | "authorization" | "complete";
  reason?: string;
  isSuperAdmin?: boolean;
  metadata?: Record<string, any>;
}

/**
 * Determina si el usuario es SuperAdministrador global con acceso irrestricto.
 */
export async function isSuperAdminUser(userId: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, email: true },
    });
    if (!user) return false;
    if (user.role === "super_admin" || user.role === "SUPER_ADMIN") return true;
    if (user.email && GLOBAL_SUPERADMIN_EMAILS.includes(user.email.toLowerCase())) return true;
    return false;
  } catch (error) {
    logger.error("[SecurityPipeline] Error checking super admin status:", { error: String(error) });
    return false;
  }
}

/**
 * Ejecuta la evaluación secuencial estricta a través de los 5 motores.
 * En caso de fallo en cualquier motor, cortocircuita inmediatamente devolviendo
 * el diagnóstico y el motivo exacto del rechazo.
 */
export async function executeSecurityPipeline(
  ctx: SecurityPipelineContext
): Promise<SecurityPipelineResult> {
  const { userId, companyId, permission, requiredTier = "free", allowGracePeriod = true } = ctx;

  // ───────────────────────────────────────────────────────────────────────────
  // MOTOR 1: MOTOR DE AUTENTICACIÓN
  // ───────────────────────────────────────────────────────────────────────────
  if (!userId) {
    return {
      allowed: false,
      stage: "auth",
      reason: "No se proporcionó una identidad de usuario válida (No autenticado).",
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      role: true,
      isActive: true,
      emailVerified: true,
    },
  });

  if (!user) {
    return {
      allowed: false,
      stage: "auth",
      reason: "La cuenta de usuario no existe o ha sido dada de baja.",
    };
  }

  if (user.isActive === false) {
    return {
      allowed: false,
      stage: "auth",
      reason: "La cuenta de usuario se encuentra temporalmente inactiva o suspendida.",
    };
  }

  // Bypass universal para SuperAdmin de la plataforma: Acceso total garantizado
  const isSuper =
    user.role === "super_admin" ||
    user.role === "SUPER_ADMIN" ||
    (user.email ? GLOBAL_SUPERADMIN_EMAILS.includes(user.email.toLowerCase()) : false);

  if (isSuper) {
    return {
      allowed: true,
      stage: "complete",
      isSuperAdmin: true,
      reason: "SuperAdmin Universal Bypass: Autorización total de plataforma concedida.",
    };
  }

  // Si no se requiere contexto de tenant, la autenticación sola satisface peticiones de perfil base
  if (!companyId) {
    return {
      allowed: true,
      stage: "complete",
      reason: "Autenticación global verificada satisfactoriamente (Sin contexto de tenant).",
    };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // MOTOR 2: MOTOR DE SUSCRIPCIÓN
  // ───────────────────────────────────────────────────────────────────────────
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: {
      id: true,
      name: true,
      subscriptionTier: true,
      subscriptionStatus: true,
      createdAt: true,
    },
  });

  if (!company) {
    return {
      allowed: false,
      stage: "subscription",
      reason: `La empresa/inquilino con ID '${companyId}' no existe en el sistema.`,
    };
  }

  const currentTier = (company.subscriptionTier || "free").toLowerCase();
  const subStatus = (company.subscriptionStatus || "active").toLowerCase();

  // Jerarquía de tiers de menor a mayor
  const tierRanks: Record<string, number> = {
    free: 0,
    starter: 1,
    pro: 2,
    enterprise: 3,
  };

  const currentRank = tierRanks[currentTier] ?? 0;
  const requiredRank = tierRanks[requiredTier] ?? 0;

  // Validación de estatus de suscripción en el motor de suscripción
  const invalidStatuses = ["canceled", "terminated", "expired"];
  if (invalidStatuses.includes(subStatus)) {
    return {
      allowed: false,
      stage: "subscription",
      reason: `La suscripción de la empresa '${company.name}' está cancelada o expirada (${subStatus}).`,
    };
  }

  if (currentRank < requiredRank) {
    return {
      allowed: false,
      stage: "subscription",
      reason: `La acción requiere el plan '${requiredTier.toUpperCase()}', pero la empresa cuenta con el plan '${currentTier.toUpperCase()}'.`,
    };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // MOTOR 3: MOTOR DE FACTURACIÓN
  // ───────────────────────────────────────────────────────────────────────────
  // Si la suscripción está marcada como mora crítica o bloqueo comercial
  if (subStatus === "past_due" || subStatus === "unpaid") {
    // Verificar si existe gracia activa o si hay facturas vencidas bloqueantes
    const overdueInvoicesCount = await prisma.invoice.count({
      where: {
        companyId,
        status: { in: ["OVERDUE", "UNPAID"] },
        dueDate: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // Más de 7 días de vencimiento
      },
    });

    if (overdueInvoicesCount > 0 && !allowGracePeriod) {
      return {
        allowed: false,
        stage: "billing",
        reason: `Acceso restringido por el Motor de Facturación: La empresa tiene ${overdueInvoicesCount} factura(s) con mora vencida pendiente de pago.`,
      };
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // MOTOR 4: MOTOR DE POLÍTICAS CENTRALIZADAS (PDP / CENTRALIZED POLICY ENGINE)
  // ───────────────────────────────────────────────────────────────────────────
  // Aislamiento Multi-Tenant: El usuario DEBE pertenecer formalmente al tenant solicitado
  const membership = await prisma.companyUser.findFirst({
    where: {
      userId,
      companyId,
    },
    include: {
      role: {
        include: {
          permissions: {
            include: { permission: true },
          },
        },
      },
    },
  });

  if (!membership) {
    return {
      allowed: false,
      stage: "policy",
      reason: `Violación de Límite de Inquilino (Tenant Boundary): El usuario no pertenece a la organización solicitada.`,
    };
  }

  // Si la membresía está explícitamente inactiva
  if ((membership as any).status === "INACTIVE" || (membership as any).status === "SUSPENDED") {
    return {
      allowed: false,
      stage: "policy",
      reason: `Acceso denegado por política centralizada: La membresía en esta organización está inactiva o suspendida.`,
    };
  }

  // Si no se solicita permiso granular específico, el pipeline se aprueba tras superar las políticas
  if (!permission) {
    return {
      allowed: true,
      stage: "complete",
      metadata: { role: membership.roleName, tier: currentTier },
    };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // MOTOR 5: MOTOR DE AUTORIZACIÓN (RBAC & ABAC GRANULAR)
  // ───────────────────────────────────────────────────────────────────────────
  // 5.1 Permiso sobre recurso específico (ABAC granular si aplica)
  if (ctx.resourceType && ctx.resourceId) {
    const resourcePerm = await prisma.resourcePermission.findFirst({
      where: {
        userId,
        companyId,
        resourceType: ctx.resourceType,
        resourceId: ctx.resourceId,
        permission,
      },
    });

    if (resourcePerm !== null) {
      if (resourcePerm.access) {
        return {
          allowed: true,
          stage: "complete",
          metadata: { resolvedVia: "resource_permission" },
        };
      } else {
        return {
          allowed: false,
          stage: "authorization",
          reason: `Permiso específico sobre el recurso ${ctx.resourceType}:${ctx.resourceId} denegado explícitamente.`,
        };
      }
    }
  }

  // 5.2 Propietario u Owner de la Empresa: Autorización completa sobre operaciones de su tenant
  const isOwner =
    ["owner", "OWNER"].includes(membership.roleName) ||
    membership.role?.name?.toLowerCase() === "owner" ||
    (membership.role?.priority ?? 0) >= 100;

  if (isOwner) {
    return {
      allowed: true,
      stage: "complete",
      metadata: { resolvedVia: "company_owner" },
    };
  }

  // 5.3 Rol Administrador Operativo de la Empresa
  const isAdmin =
    ["admin", "ADMIN"].includes(membership.roleName) ||
    membership.role?.name?.toLowerCase() === "admin" ||
    (membership.role?.priority ?? 0) >= 80;

  // Los administradores de empresa tienen permiso intrínseco en la gestión de roles, usuarios y configuración interna
  if (isAdmin && (permission.startsWith("settings.") || permission.startsWith("users.") || permission.startsWith("iam."))) {
    return {
      allowed: true,
      stage: "complete",
      metadata: { resolvedVia: "company_admin" },
    };
  }

  // 5.4 Evaluación de permisos granulares asignados al rol personalizado
  const rolePermissions = membership.role?.permissions?.map((p) => p.permission.name) || [];
  const hasGranularPermission = rolePermissions.includes(permission);

  if (hasGranularPermission) {
    return {
      allowed: true,
      stage: "complete",
      metadata: { resolvedVia: "role_permission", role: membership.role?.name },
    };
  }

  return {
    allowed: false,
    stage: "authorization",
    reason: `El rol '${membership.role?.name || membership.roleName}' no tiene asignado el permiso '${permission}'.`,
  };
}

/**
 * Validador ejecutable que arroja excepción tipada de no autorizarse la solicitud.
 */
export async function executeSecurityPipelineOrFail(
  ctx: SecurityPipelineContext
): Promise<SecurityPipelineResult> {
  const result = await executeSecurityPipeline(ctx);
  if (!result.allowed) {
    if (result.stage === "auth") {
      throw new UnauthorizedError(result.reason || "Error de autenticación.");
    }
    throw new ForbiddenError(
      `[Seguridad - Motor de ${result.stage.toUpperCase()}] ${result.reason || "Acceso denegado."}`
    );
  }
  return result;
}
