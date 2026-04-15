/**
 * scripts/testing/seed-role-configs.ts
 * ─────────────────────────────────────────────────────
 * Pobla la tabla role_configs con los roles custom existentes.
 * Ejecutar una vez después de aplicar la migración add_role_config.
 *
 * Uso:
 *   npx tsx scripts/testing/seed-role-configs.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ROLES_TO_SEED = [
    {
        roleName: 'gerente',
        description: 'Gerente: acceso a Analytics, Inbox, CRM y Marketing',
        allowedRoutes: [
            '/dashboard',
            '/dashboard/analytics',
            '/dashboard/inbox',
            '/dashboard/marketing',
            '/dashboard/marketing/campaigns',
            '/dashboard/marketing/links',
            '/dashboard/admin/crm',
            '/dashboard/admin/crm/leads',
            '/dashboard/admin/crm/pipeline',
            '/dashboard/admin/crm/campaigns',
        ],
    },
    {
        roleName: 'viewer',
        description: 'Viewer: solo lectura de Posts y Proyectos',
        allowedRoutes: [
            '/dashboard',
            '/dashboard/posts',
            '/dashboard/projects',
        ],
    },
];

async function main() {
    console.log('\n🌱  SEED ROLE CONFIGS\n');

    for (const role of ROLES_TO_SEED) {
        const result = await prisma.roleConfig.upsert({
            where: { roleName: role.roleName },
            create: role,
            update: { allowedRoutes: role.allowedRoutes, description: role.description },
        });
        console.log(`✅  ${result.roleName} — ${(result.allowedRoutes as string[]).length} rutas`);
    }

    console.log('\n✅  Seed completado. Verifica con:');
    console.log('    npx tsx scripts/testing/verify-rbac-matrix.ts\n');
}

main()
    .catch(e => { console.error('❌ ERROR:', e); process.exit(1); })
    .finally(() => prisma.$disconnect());
