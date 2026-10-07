/**
 * scripts/seed-permissions.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Permission Synchronization Script
 *
 * Ensures every permission defined in MASTER_PERMISSIONS exists
 * in the Permission table across PostgreSQL databases (Core and Auth).
 * Never deletes or breaks existing role associations.
 *
 * RUN:  npx tsx scripts/seed-permissions.ts
 * SAFE: Strictly Idempotent — uses upsert to ensure zero duplicates.
 */

import { PrismaClient } from "@prisma/client";
import { MASTER_PERMISSIONS } from "../lib/rbac";

async function syncPermissionsToDatabase(url: string | undefined, label: string) {
    if (!url) {
        console.log(`⚠️  [${label}] URL not provided in environment, skipping.`);
        return;
    }

    const client = new PrismaClient({
        datasources: {
            db: { url },
        },
    });

    console.log(`\n═══════════════════════════════════════════════════════════`);
    console.log(`  Syncing Permissions to: ${label}`);
    console.log(`═══════════════════════════════════════════════════════════`);

    try {
        const existing = await client.permission.findMany({ select: { name: true } });
        const existingNames = new Set(existing.map((p) => p.name));

        let created = 0;
        let skipped = 0;

        for (const perm of MASTER_PERMISSIONS) {
            if (existingNames.has(perm.name)) {
                skipped++;
                continue;
            }

            await client.permission.upsert({
                where: { name: perm.name },
                update: {
                    module: perm.module,
                    description: perm.description,
                    isActive: true,
                },
                create: {
                    name: perm.name,
                    module: perm.module,
                    description: perm.description,
                    isActive: true,
                },
            });

            console.log(`  ✅ Inserted: [${perm.module}] ${perm.name}`);
            created++;
        }

        console.log(`  Resultado [${label}]: ${created} nuevos permisos creados, ${skipped} ya existían.`);
        console.log(`  Total permisos en ${label}: ${existingNames.size + created}`);
    } catch (err: any) {
        console.error(`  ❌ Error sincronizando ${label}:`, err.message);
    } finally {
        await client.$disconnect();
    }
}

async function main() {
    console.log("═══════════════════════════════════════════════════════════");
    console.log("  LegacyMark — Global RBAC Permissions Synchronization");
    console.log("═══════════════════════════════════════════════════════════");

    const coreUrl = process.env.CORE_DATABASE_URL || process.env.DATABASE_URL;
    const authUrl = process.env.AUTH_DATABASE_URL;

    // 1. Sincronizar CORE_DATABASE_URL (Base primaria de Roles y Permisos)
    await syncPermissionsToDatabase(coreUrl, "CORE_DATABASE");

    // 2. Si AUTH_DATABASE_URL está configurada y es diferente a CORE, sincronizar también
    if (authUrl && authUrl !== coreUrl) {
        await syncPermissionsToDatabase(authUrl, "AUTH_DATABASE");
    }

    console.log(`\n🎉 Sincronización de permisos completada exitosamente.\n`);
}

main().catch((e) => {
    console.error("❌ Fatal seed error:", e);
    process.exit(1);
});