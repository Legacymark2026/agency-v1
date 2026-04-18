"use server";
/**
 * scripts/seed-permissions.ts
 * ─────────────────────────────────────────────────────────────
 * Script para sembrar el catálogo de permisos del sistema.
 * Este script debe ejecutarse UNA SOLA VEZ al activar el RBAC.
 * 
 * USO: npx tsx scripts/seed-permissions.ts
 */

import { prisma } from "@/lib/prisma";
import { SYSTEM_PERMISSIONS, MODULES } from "@/types/rbac";

async function seedPermissions() {
  console.log("🌱 Starting RBAC permissions seed...");

  const permissionsData = Object.entries(SYSTEM_PERMISSIONS).map(
    ([name, info]) => ({
      name,
      module: info.module,
      description: info.description,
      isActive: true,
    })
  );

  console.log(`📝 Creating ${permissionsData.length} permissions...`);

  for (const perm of permissionsData) {
    await prisma.permission.upsert({
      where: { name: perm.name },
      update: {
        module: perm.module,
        description: perm.description,
        isActive: true,
      },
      create: perm,
    });
  }

  const count = await prisma.permission.count({
    where: { isActive: true },
  });

  console.log(`✅ Seed completed! Total active permissions: ${count}`);

  const modulesCount = Object.values(MODULES).reduce((acc, mod) => {
    acc[mod] = 0;
    return acc;
  }, {} as Record<string, number>);

  const allPerms = await prisma.permission.findMany({
    where: { isActive: true },
    select: { module: true },
  });

  allPerms.forEach((p) => {
    if (modulesCount[p.module] !== undefined) {
      modulesCount[p.module]++;
    }
  });

  console.log("\n📊 Permissions by module:");
  Object.entries(modulesCount).forEach(([mod, count]) => {
    console.log(`  - ${mod}: ${count}`);
  });

  process.exit(0);
}

seedPermissions().catch((error) => {
  console.error("❌ Seed failed:", error);
  process.exit(1);
});