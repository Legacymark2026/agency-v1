/**
 * Database Provisioning & Promotion Script: Global SuperAdmin
 * ─────────────────────────────────────────────────────────────────────────────
 * Ensures 'administrador@legacymarksas.com' is provisioned in PostgreSQL with:
 * - Role: SUPER_ADMIN (super_admin)
 * - Status: ACTIVE
 * - Full system permissions across all modules
 */

import { prisma } from "../apps/web/lib/prisma";
import { UserRole } from "../apps/web/types/auth";
import { MASTER_PERMISSIONS } from "../apps/web/lib/rbac";
import bcrypt from "bcryptjs";

const SUPERADMIN_EMAIL = "administrador@legacymarksas.com";
const DEFAULT_PASSWORD = process.env.ADMIN_INITIAL_PASSWORD || "LegacyAdmin2026!#Global";

async function promoteSuperAdmin() {
  console.log("===============================================================================");
  console.log(`👑 CONFIGURACIÓN DE SUPERADMINISTRADOR GLOBAL: ${SUPERADMIN_EMAIL}`);
  console.log("===============================================================================\n");

  try {
    const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 12);

    // 1. Upsert User in PostgreSQL
    const user = await prisma.user.upsert({
      where: { email: SUPERADMIN_EMAIL },
      update: {
        role: UserRole.SUPER_ADMIN,
        name: "Administrador Global",
      },
      create: {
        email: SUPERADMIN_EMAIL,
        name: "Administrador Global",
        role: UserRole.SUPER_ADMIN,
        passwordHash,
      },
    });

    console.log(`✅ Usuario SuperAdmin sincronizado en DB: ${user.email} (ID: ${user.id}, Rol: ${user.role})`);

    // 2. Ensure Primary Company exists
    let company = await prisma.company.findFirst();
    if (!company) {
      company = await prisma.company.create({
        data: {
          name: "LEGACYMARK S.A.S.",
          slug: "legacymark",
        },
      });
      console.log(`✅ Empresa principal creada: ${company.name} (ID: ${company.id})`);
    }

    // 3. Ensure Company Membership with All Master Permissions
    const allPermissions = MASTER_PERMISSIONS.map((p) => p.name);

    const existingMembership = await prisma.companyUser.findFirst({
      where: {
        userId: user.id,
        companyId: company.id,
      },
    });

    if (!existingMembership) {
      await prisma.companyUser.create({
        data: {
          userId: user.id,
          companyId: company.id,
          role: "SUPER_ADMIN",
          permissions: allPermissions,
        },
      });
      console.log(`✅ Membresía corporativa vinculada con ${allPermissions.length} permisos maestros.`);
    } else {
      await prisma.companyUser.update({
        where: { id: existingMembership.id },
        data: {
          role: "SUPER_ADMIN",
          permissions: allPermissions,
        },
      });
      console.log(`✅ Membresía corporativa actualizada con ${allPermissions.length} permisos maestros.`);
    }

    console.log("\n===============================================================================");
    console.log(`🎉 SUPERADMINISTRADOR GLOBAL LISTO Y BLINDADO: ${SUPERADMIN_EMAIL}`);
    console.log("Acceso irrestricto concedido a todo el Dashboard, Microservicios y Base de Datos.");
    console.log("===============================================================================");
  } catch (error: any) {
    console.error("❌ Error provisionando SuperAdmin:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

promoteSuperAdmin();
