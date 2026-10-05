"use server";

/**
 * actions/onboarding.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Server Action para aprovisionar autónomamente (Self-Serve) un Inquilino B2B.
 * Sincronizado atómicamente con los 5 motores: Auth, AuthZ, Policy, Subscription y Payment.
 */

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { ActionResult, fail, ok } from "@/types/actions";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

const RegisterAgencySchema = z.object({
  agencyName: z.string().min(2, "El nombre de la empresa es muy corto."),
  adminName: z.string().min(2, "Ingresa tu nombre completo."),
  email: z.string().email("Correo electrónico inválido."),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres."),
  industry: z.string().optional().default("marketing"),
  teamSize: z.string().optional().default("2-5"),
  country: z.string().optional().default("CO"),
  deviceFingerprint: z.string().optional().nullable(),
});

// Permisos fundamentales por defecto para los roles estándar de la nueva empresa
const BASE_SYSTEM_PERMISSIONS = [
  { name: "*", module: "system", description: "Acceso total a la plataforma" },
  { name: "dashboard.view", module: "dashboard", description: "Ver dashboard principal" },
  { name: "invoices.create", module: "finance", description: "Crear facturas electrónicas" },
  { name: "invoices.read", module: "finance", description: "Ver facturas electrónicas" },
  { name: "invoices.manage", module: "finance", description: "Gestionar facturación" },
  { name: "crm.view_all", module: "crm", description: "Ver todos los leads y pipeline" },
  { name: "crm.edit", module: "crm", description: "Crear y editar oportunidades" },
  { name: "pos.orders.create", module: "pos", description: "Crear órdenes de venta POS" },
  { name: "users.manage", module: "iam", description: "Gestionar miembros del equipo" },
  { name: "settings.roles.manage", module: "iam", description: "Gestionar roles y permisos" },
];

export async function registerAgency(formData: FormData): Promise<ActionResult<{ redirectTo: string }>> {
  const data = Object.fromEntries(formData);
  const result = RegisterAgencySchema.safeParse(data);

  if (!result.success) {
    return fail("Datos inválidos: " + result.error.errors[0].message, 400);
  }

  const { agencyName, adminName, email, password, industry, teamSize, country, deviceFingerprint } = result.data;

  try {
    // 1. Validar que el correo no esté en uso globalmente
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return fail("El correo ya está en uso. Inicia sesión en su lugar.", 409);
    }

    // 2. Extraer IP y User Agent del cliente para seguridad y auditoría
    let clientIp = "127.0.0.1";
    let userAgent = "Web Browser";
    try {
      const headerList = await headers();
      clientIp = headerList.get("x-forwarded-for")?.split(",")[0]?.trim() || headerList.get("x-real-ip") || "127.0.0.1";
      userAgent = headerList.get("user-agent") || "Web Browser";
    } catch {
      // Ignorar fuera de contexto http
    }

    // 3. Garantizar que los permisos base existan en tbl_permissions (Idempotente)
    for (const p of BASE_SYSTEM_PERMISSIONS) {
      await prisma.permission.upsert({
        where: { name: p.name },
        update: { module: p.module, description: p.description },
        create: { name: p.name, module: p.module, description: p.description, isActive: true },
      }).catch(() => {});
    }

    // Obtener los permisos registrados para su asociación
    const permissionsInDb = await prisma.permission.findMany({
      where: { name: { in: BASE_SYSTEM_PERMISSIONS.map(p => p.name) } },
    });
    const permMap = new Map(permissionsInDb.map(p => [p.name, p.id]));

    // Mapeo regional para motores de facturación y pagos
    const REGIONAL_PRESETS: Record<string, { currency: string; locale: string; timezone: string; taxRate: number }> = {
      CO: { currency: "COP", locale: "es-CO", timezone: "America/Bogota", taxRate: 19 },
      MX: { currency: "MXN", locale: "es-MX", timezone: "America/Mexico_City", taxRate: 16 },
      US: { currency: "USD", locale: "en-US", timezone: "America/New_York", taxRate: 0 },
      ES: { currency: "EUR", locale: "es-ES", timezone: "Europe/Madrid", taxRate: 21 },
      OTHER: { currency: "USD", locale: "es-419", timezone: "UTC", taxRate: 0 },
    };
    const region = REGIONAL_PRESETS[country || "CO"] || REGIONAL_PRESETS.CO;

    // 4. Crear el Tenant (Company) con sus configuraciones regionales iniciales
    const slugBase = agencyName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const uniqueSlug = `${slugBase}-${Date.now().toString().slice(-6)}`;

    const company = await prisma.company.create({
      data: {
        name: agencyName,
        slug: uniqueSlug,
        industry: industry || "marketing",
        subscriptionTier: "free",
        subscriptionStatus: "active",
        onboardingCompleted: false,
        defaultCompanySettings: {
          country: country || "CO",
          teamSize: teamSize || "2-5",
          currency: region.currency,
          locale: region.locale,
          timezone: region.timezone,
          taxRateDefault: region.taxRate,
        },
        whiteLabeling: {
          primaryColor: "#0d9488", // Teal 600 default
          logo: null,
          companyDisplayName: agencyName,
        },
      },
    });

    // 5. Sembrar Roles Estándar de la Empresa en tbl_roles
    // Rol 1: Owner (Propietario - Prioridad 100)
    const ownerRole = await prisma.role.create({
      data: {
        name: "owner",
        companyId: company.id,
        description: `Propietario de ${agencyName} con acceso irrestricto`,
        priority: 100,
        isDefault: false,
        isActive: true,
      },
    });

    // Rol 2: Admin (Administrador - Prioridad 80)
    const adminRole = await prisma.role.create({
      data: {
        name: "admin",
        companyId: company.id,
        description: `Administrador operativo de ${agencyName}`,
        priority: 80,
        isDefault: false,
        isActive: true,
      },
    });

    // Rol 3: Member (Miembro Operativo - Prioridad 10, Rol por defecto para nuevos invitados)
    const memberRole = await prisma.role.create({
      data: {
        name: "member",
        companyId: company.id,
        description: `Miembro estándar del equipo de ${agencyName}`,
        priority: 10,
        isDefault: true,
        isActive: true,
      },
    });

    // 6. Asignar Permisos a los Roles
    const rolePermissionBindings: Array<{ roleId: string; permissionId: string }> = [];

    // Owner recibe el comodín '*' y todos los permisos base
    for (const perm of permissionsInDb) {
      rolePermissionBindings.push({ roleId: ownerRole.id, permissionId: perm.id });
    }

    // Admin recibe permisos operativos
    const adminPermNames = ["dashboard.view", "invoices.create", "invoices.read", "invoices.manage", "crm.view_all", "crm.edit", "pos.orders.create", "users.manage"];
    for (const name of adminPermNames) {
      const pId = permMap.get(name);
      if (pId) rolePermissionBindings.push({ roleId: adminRole.id, permissionId: pId });
    }

    // Member recibe permisos de lectura / visualización
    const memberPermNames = ["dashboard.view", "invoices.read", "crm.view_all"];
    for (const name of memberPermNames) {
      const pId = permMap.get(name);
      if (pId) rolePermissionBindings.push({ roleId: memberRole.id, permissionId: pId });
    }

    if (rolePermissionBindings.length > 0) {
      await prisma.rolePermission.createMany({
        data: rolePermissionBindings,
        skipDuplicates: true,
      }).catch(() => {});
    }

    // 7. Crear el Usuario Administrador y vincularlo formalmente a la Empresa
    const passwordHash = await bcrypt.hash(password, 10);
    const [firstName, ...lastNameParts] = adminName.split(" ");
    const lastName = lastNameParts.join(" ") || "";

    const user = await prisma.user.create({
      data: {
        email,
        name: adminName,
        firstName,
        lastName,
        passwordHash,
        role: "admin", // Rol Legacy global
        globalRole: "agency_owner",
      },
    });

    // Vinculación Formal Multi-Tenant con UUID de Rol real y roleName alineado
    await prisma.companyUser.create({
      data: {
        userId: user.id,
        companyId: company.id,
        roleId: ownerRole.id,
        roleName: "owner",
        permissions: ["*"],
      },
    });

    // 8. Crear configuración de enrutamiento dinámico (RoleConfig) para compatibilidad RBAC
    await prisma.roleConfig.upsert({
      where: { roleName: `admin_${company.id}` },
      update: { allowedRoutes: ["*"], isActive: true },
      create: {
        roleName: `admin_${company.id}`,
        description: `Admin Dinámico para ${agencyName}`,
        allowedRoutes: ["*"],
        isActive: true,
      },
    }).catch(() => {});

    // 9. Registrar el Trial y el Device Fingerprint en el Motor de Suscripciones (subscription-service)
    const effectiveDeviceHash = deviceFingerprint && deviceFingerprint.length === 64
      ? deviceFingerprint
      : `fp-srv-${company.id.slice(0, 16)}-${Date.now()}`;

    try {
      const subServiceUrl = process.env.SUBSCRIPTION_SERVICE_URL || "http://subscription-service:4060";
      const claimRes = await fetch(`${subServiceUrl}/api/subscriptions/trial/claim`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-device-fingerprint": effectiveDeviceHash,
        },
        body: JSON.stringify({
          companyId: company.id,
          deviceHash: effectiveDeviceHash,
          durationDays: 14,
        }),
        signal: AbortSignal.timeout(2000), // Timeout corto para no bloquear la respuesta al usuario
      });

      if (claimRes.ok) {
        const claimData = await claimRes.json();
        if (claimData.trialEndsAt) {
          await prisma.company.update({
            where: { id: company.id },
            data: { subscriptionStatus: "trialing" },
          }).catch(() => {});
        }
      }
    } catch {
      // Si el servicio de suscripción está desconectado o en modo dev, la empresa continúa en estado 'active' (free)
    }

    // 10. Éxito: Enviar al Login con redirect a Onboarding / Dashboard
    return ok({ redirectTo: "/api/auth/signin?callbackUrl=/dashboard" });

  } catch (error: any) {
    console.error("[SaaS Onboarding Error]:", error);
    return fail("No se pudo aprovisionar la empresa. Contacta a soporte.", 500);
  }
}

export async function checkOnboardingStatus() {
    const session = await auth();
    if (!session?.user?.companyId) return { success: false, onboardingCompleted: true };

    try {
        const company = await prisma.company.findUnique({
            where: { id: session.user.companyId },
            select: { onboardingCompleted: true }
        });

        return { success: true, onboardingCompleted: company?.onboardingCompleted ?? true };
    } catch (e) {
        return { success: false, onboardingCompleted: true };
    }
}

export async function completeOnboardingAndCloneTemplates() {
    const session = await auth();
    if (!session?.user?.companyId) return { success: false, error: "Unauthorized" };
    
    const companyId = session.user.companyId;

    try {
        const templates = await prisma.workflow.findMany({
            where: { isTemplate: true, companyId: null }
        });

        for (const template of templates) {
            const existing = await prisma.workflow.findFirst({
                where: { companyId, name: template.name }
            });

            if (!existing) {
                await prisma.workflow.create({
                    data: {
                        name: template.name,
                        description: template.description,
                        triggerType: template.triggerType,
                        triggerConfig: template.triggerConfig ?? {},
                        steps: template.steps ?? [],
                        isActive: false, 
                        companyId: companyId
                    }
                });
            }
        }

        await prisma.company.update({
            where: { id: companyId },
            data: { onboardingCompleted: true }
        });

        revalidatePath('/', 'layout');
        return { success: true };
    } catch (e: any) {
        console.error("Error in completeOnboarding:", e);
        return { success: false, error: e.message };
    }
}
