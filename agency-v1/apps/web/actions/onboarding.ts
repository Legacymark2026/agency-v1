"use server";

/**
 * actions/onboarding.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Server Action para aprovisionar autónomamente (Self-Serve) un Inquilino B2B.
 */

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { ActionResult, fail, ok } from "@/types/actions";

const RegisterAgencySchema = z.object({
  agencyName: z.string().min(2, "El nombre de la empresa es muy corto."),
  adminName: z.string().min(2, "Ingresa tu nombre completo."),
  email: z.string().email("Correo electrónico inválido."),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres."),
});

export async function registerAgency(formData: FormData): Promise<ActionResult<{ redirectTo: string }>> {
  const data = Object.fromEntries(formData);
  const result = RegisterAgencySchema.safeParse(data);

  if (!result.success) {
    return fail("Datos inválidos: " + result.error.errors[0].message, 400);
  }

  const { agencyName, adminName, email, password } = result.data;

  try {
    // 1. Validar que el correo no esté en uso globalmente
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return fail("El correo ya está en uso. Inicia sesión en su lugar.", 409);
    }

    // 2. Transacción Atómica de Aprovisionamiento (Zero-Trust)
    await prisma.$transaction(async (tx) => {
      // a) Crear Company (Tenant)
      const slugBase = agencyName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const company = await tx.company.create({
        data: {
          name: agencyName,
          slug: `${slugBase}-${Date.now()}`, // Garantiza slug único
          subscriptionTier: "free",
          subscriptionStatus: "active",
          whiteLabeling: {
             primaryColor: "#0d9488", // Teal 600 default
             logo: null
          }
        },
      });

      // b) Crear Admin User
      const passwordHash = await bcrypt.hash(password, 10);
      const [firstName, ...lastNameParts] = adminName.split(" ");
      const lastName = lastNameParts.join(" ") || "";

      const user = await tx.user.create({
        data: {
          email,
          name: adminName,
          firstName,
          lastName,
          passwordHash,
          role: "admin", // Rol Legacy global (opcional)
          globalRole: "agency_owner",
        },
      });

      // c) Vincular el usuario a la Empresa con Rol Administrativo
      await tx.companyUser.create({
        data: {
          userId: user.id,
          companyId: company.id,
          roleId: "ADMIN", // Asume que ADMIN está mapeado o soportado por el Auth
        },
      });

      // d) Sembrar configuraciones base de la Agencia si es necesario
      await tx.roleConfig.create({
        data: {
           roleName: `ADMIN_${company.id}`,
           description: `Admin Dinámico para ${agencyName}`,
           allowedRoutes: ["*"],
        }
      }).catch(() => {}); // Opcional, dependiendo de la estrictez del IAM

    });

    // 3. Éxito: Enviar a Login
    return ok({ redirectTo: "/api/auth/signin?callbackUrl=/dashboard" });

  } catch (error: any) {
    console.error("[SaaS Onboarding Error]:", error);
    return fail("No se pudo aprovisionar la agencia. Contacta a soporte.", 500);
  }
}

import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function checkOnboardingStatus() {
    const session = await auth();
    if (!session?.user?.companyId) return { success: false, onboardingCompleted: true }; // Si no hay company, se asume completado para no bloquear

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
