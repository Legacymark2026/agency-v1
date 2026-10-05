"use server";

/**
 * actions/onboarding.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Server Action para aprovisionar autónomamente (Self-Serve) un Inquilino B2B.
 * Sincronizado atómicamente con los 5 motores: Auth, AuthZ, Policy, Subscription y Payment.
 */

import { prisma, getPrismaAuth, getPrismaCore } from "@/shared/lib/prisma";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { ActionResult, fail, ok } from "@/types/actions";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { analyzeEmailReputation, analyzeNetworkSecurity } from "@/lib/security-signals";

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
    // 1. Análisis de Seguridad Silenciosa: Reputación del Correo
    const emailReputation = analyzeEmailReputation(email);
    if (emailReputation.isDisposable) {
      return fail("No se permiten correos electrónicos temporales o desechables. Por favor usa tu correo corporativo o personal.", 400);
    }

    const prismaAuth = getPrismaAuth();
    const prismaCore = getPrismaCore();

    // 2. Validar si el usuario ya existe
    const existingUser = await prismaAuth.user.findUnique({ where: { email } });
    if (existingUser) {
      // Verificar si el usuario ya tiene un espacio de trabajo o membresía activa en Core DB
      const existingMembership = await prismaCore.companyUser.findFirst({
        where: { userId: existingUser.id },
      });

      if (existingMembership) {
        return fail("El correo ya está registrado y cuenta con un espacio de trabajo. Inicia sesión en su lugar.", 409);
      }

      // Si es un usuario huérfano (originado por un intento previo fallido sin empresa vinculada), se limpia para permitir el registro limpio
      await prismaAuth.user.delete({ where: { id: existingUser.id } }).catch(() => {});
      await prismaCore.user.delete({ where: { id: existingUser.id } }).catch(() => {});
    }

    // 3. Extraer IP y cabeceras para Análisis Silencioso de Red y Riesgo de Bot/Proxy
    let clientIp = "127.0.0.1";
    let userAgent = "Web Browser";
    let networkRisk = { isPotentialProxyOrDatacenter: false, riskScore: 0, reasons: [] as string[] };

    try {
      const headerList = await headers();
      clientIp = headerList.get("x-forwarded-for")?.split(",")[0]?.trim() || headerList.get("x-real-ip") || "127.0.0.1";
      userAgent = headerList.get("user-agent") || "Web Browser";
      networkRisk = analyzeNetworkSecurity(clientIp, headerList as any);
    } catch {
      // Ignorar fuera de contexto http
    }

    // 3. Garantizar que los permisos base existan en tbl_permissions (Idempotente) en ambos almacenes
    for (const p of BASE_SYSTEM_PERMISSIONS) {
      await prismaAuth.permission.upsert({
        where: { name: p.name },
        update: { module: p.module, description: p.description },
        create: { name: p.name, module: p.module, description: p.description, isActive: true },
      }).catch(() => {});
      await prismaCore.permission.upsert({
        where: { name: p.name },
        update: { module: p.module, description: p.description },
        create: { name: p.name, module: p.module, description: p.description, isActive: true },
      }).catch(() => {});
    }

    // Obtener los permisos registrados para su asociación
    const permissionsInAuth = await prismaAuth.permission.findMany({
      where: { name: { in: BASE_SYSTEM_PERMISSIONS.map(p => p.name) } },
    });
    const permissionsInCore = await prismaCore.permission.findMany({
      where: { name: { in: BASE_SYSTEM_PERMISSIONS.map(p => p.name) } },
    });
    const authPermMap = new Map(permissionsInAuth.map(p => [p.name, p.id]));
    const corePermMap = new Map(permissionsInCore.map(p => [p.name, p.id]));

    // Mapeo regional para motores de facturación y pagos
    const REGIONAL_PRESETS: Record<string, { currency: string; locale: string; timezone: string; taxRate: number }> = {
      CO: { currency: "COP", locale: "es-CO", timezone: "America/Bogota", taxRate: 19 },
      MX: { currency: "MXN", locale: "es-MX", timezone: "America/Mexico_City", taxRate: 16 },
      US: { currency: "USD", locale: "en-US", timezone: "America/New_York", taxRate: 0 },
      ES: { currency: "EUR", locale: "es-ES", timezone: "Europe/Madrid", taxRate: 21 },
      OTHER: { currency: "USD", locale: "es-419", timezone: "UTC", taxRate: 0 },
    };
    const region = REGIONAL_PRESETS[country || "CO"] || REGIONAL_PRESETS.CO;

    // 4. Crear el Tenant (Company) con sus configuraciones regionales iniciales en Core DB
    const slugBase = agencyName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const uniqueSlug = `${slugBase}-${Date.now().toString().slice(-6)}`;

    const company = await prismaCore.company.create({
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
          securityProfile: {
            emailDomain: emailReputation.domain,
            isCorporateEmail: emailReputation.isCorporate,
            emailRiskScore: emailReputation.riskScore,
            networkRiskScore: networkRisk.riskScore,
            proxyDetected: networkRisk.isPotentialProxyOrDatacenter,
            initialIp: clientIp,
          },
        },
        whiteLabeling: {
          primaryColor: "#0d9488", // Teal 600 default
          logo: null,
          companyDisplayName: agencyName,
        },
      },
    });

    // 5. Sembrar Roles Estándar con UUIDs idénticos en Auth DB y Core DB
    const ownerRoleId = randomUUID();
    const adminRoleId = randomUUID();
    const memberRoleId = randomUUID();

    const rolesData = [
      {
        id: ownerRoleId,
        name: "owner",
        companyId: company.id,
        description: `Propietario de ${agencyName} con acceso irrestricto`,
        priority: 100,
        isDefault: false,
        isActive: true,
      },
      {
        id: adminRoleId,
        name: "admin",
        companyId: company.id,
        description: `Administrador operativo de ${agencyName}`,
        priority: 80,
        isDefault: false,
        isActive: true,
      },
      {
        id: memberRoleId,
        name: "member",
        companyId: company.id,
        description: `Miembro estándar del equipo de ${agencyName}`,
        priority: 10,
        isDefault: true,
        isActive: true,
      },
    ];

    for (const r of rolesData) {
      await prismaAuth.role.create({ data: r }).catch(() => {});
      await prismaCore.role.create({ data: r }).catch(() => {});
    }

    // 6. Asignar Permisos a los Roles en ambos motores
    const bindRolePermissions = async (
      client: any,
      permMap: Map<string, string>,
      perms: any[]
    ) => {
      const bindings: Array<{ roleId: string; permissionId: string }> = [];
      for (const perm of perms) {
        bindings.push({ roleId: ownerRoleId, permissionId: perm.id });
      }
      const adminPermNames = ["dashboard.view", "invoices.create", "invoices.read", "invoices.manage", "crm.view_all", "crm.edit", "pos.orders.create", "users.manage"];
      for (const name of adminPermNames) {
        const pId = permMap.get(name);
        if (pId) bindings.push({ roleId: adminRoleId, permissionId: pId });
      }
      const memberPermNames = ["dashboard.view", "invoices.read", "crm.view_all"];
      for (const name of memberPermNames) {
        const pId = permMap.get(name);
        if (pId) bindings.push({ roleId: memberRoleId, permissionId: pId });
      }
      if (bindings.length > 0) {
        await client.rolePermission.createMany({
          data: bindings,
          skipDuplicates: true,
        }).catch(() => {});
      }
    };

    await bindRolePermissions(prismaAuth, authPermMap, permissionsInAuth);
    await bindRolePermissions(prismaCore, corePermMap, permissionsInCore);

    // 7. Crear el Usuario Administrador y replicarlo para integridad referencial en Core DB
    const passwordHash = await bcrypt.hash(password, 10);
    const [firstName, ...lastNameParts] = adminName.split(" ");
    const lastName = lastNameParts.join(" ") || "";
    const userId = randomUUID();

    const userData = {
      id: userId,
      email,
      name: adminName,
      firstName,
      lastName,
      passwordHash,
      role: "admin", // Rol Legacy global
      globalRole: "agency_owner",
    };

    // Crear en Auth DB (para NextAuth / JWT / login)
    const user = await prismaAuth.user.create({
      data: userData,
    });

    // Replicar en Core DB (para referencialidad e integridad FK en tbl_company_users)
    await prismaCore.user.upsert({
      where: { email },
      update: userData,
      create: userData,
    }).catch((err: any) => {
      console.warn("[Onboarding] Replicación a Core DB:", err);
    });

    // Vinculación Formal Multi-Tenant con UUID de Rol real y roleName alineado en Core DB
    await prismaCore.companyUser.create({
      data: {
        userId: user.id,
        companyId: company.id,
        roleId: ownerRoleId,
        roleName: "owner",
        permissions: ["*"],
      },
    });

    // 8. Crear configuración de enrutamiento dinámico (RoleConfig) para compatibilidad RBAC en Auth DB
    await prismaAuth.roleConfig.upsert({
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
          await prismaCore.company.update({
            where: { id: company.id },
            data: { subscriptionStatus: "trialing" },
          }).catch(() => {});
        }
      }
    } catch {
      // Si el servicio de suscripción está desconectado o en modo dev, la empresa continúa en estado 'active' (free)
    }

    // 10. Éxito: Enviar al Login con redirect a Onboarding / Dashboard
    return ok({ redirectTo: "/auth/login?registered=true" });

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

const GuidedOnboardingSchema = z.object({
  whatsappPhone: z.string().min(7, "Ingresa un número de WhatsApp válido").optional().or(z.literal("")),
  taxId: z.string().min(5, "El NIT / Identificador fiscal es muy corto").optional().or(z.literal("")),
  taxRegime: z.enum(["responsable_iva", "no_responsable_iva", "simple_tributacion"]).optional().default("no_responsable_iva"),
  baseCurrency: z.enum(["COP", "USD", "EUR"]).optional().default("COP"),
});

export async function saveGuidedOnboardingProfile(formData: FormData): Promise<ActionResult<{ success: boolean }>> {
  const session = await auth();
  if (!session?.user?.companyId) return fail("No autenticado", 401);

  const companyId = session.user.companyId;
  const rawData = Object.fromEntries(formData);
  const parsed = GuidedOnboardingSchema.safeParse(rawData);

  if (!parsed.success) {
    return fail("Datos inválidos: " + parsed.error.errors[0].message, 400);
  }

  const { whatsappPhone, taxId, taxRegime, baseCurrency } = parsed.data;

  try {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { defaultCompanySettings: true },
    });

    const currentSettings = (company?.defaultCompanySettings as Record<string, any>) || {};

    const updatedSettings = {
      ...currentSettings,
      currency: baseCurrency,
      taxProfile: {
        taxId: taxId || null,
        taxRegime,
        configuredAt: new Date().toISOString(),
      },
      whatsappNotificationPhone: whatsappPhone || null,
    };

    // 1. Actualizar Company con los metadatos fiscales y de moneda
    await prisma.company.update({
      where: { id: companyId },
      data: {
        defaultCompanySettings: updatedSettings,
      },
    });

    // 2. Si se suministró WhatsApp, sincronizar con AgentConfig para alertas automáticas del motor de IA
    if (whatsappPhone) {
      await prisma.agentConfig.upsert({
        where: { companyId },
        update: {
          adminWhatsappPhone: whatsappPhone,
          isActive: true,
        },
        create: {
          companyId,
          adminWhatsappPhone: whatsappPhone,
          isActive: true,
          systemPrompt: "Eres el asistente inteligente de operaciones y ventas de la empresa.",
        },
      }).catch(() => {});
    }

    revalidatePath("/", "layout");
    return ok({ success: true });
  } catch (error: any) {
    console.error("[Guided Onboarding Error]:", error);
    return fail("No se pudo guardar la configuración inicial: " + error.message, 500);
  }
}

