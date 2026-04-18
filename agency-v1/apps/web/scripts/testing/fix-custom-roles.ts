/**
 * fix-custom-roles.ts
 * ─────────────────────────────────────────────────────
 * Asigna roles estándar a los usuarios con roles custom:
 *   gerente → CLIENT_ADMIN  (CRM + Inbox + Dashboard)
 *   viewer  → CLIENT_USER   (Posts + Proyectos / solo lectura)
 *
 * Uso en producción:
 *   npx tsx scripts/testing/fix-custom-roles.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ROLE_MAP: { email: string; oldRole: string; newRole: string; reason: string }[] = [
    {
        email: 'nestoreiangarcia@legacymarksas.com',
        oldRole: 'gerente',
        newRole: 'CLIENT_ADMIN',
        reason: 'Gerente → CLIENT_ADMIN: acceso a CRM, Inbox, Dashboard y campañas',
    },
    {
        email: 'hebohorquez@uts.edu.co',
        oldRole: 'viewer',
        newRole: 'CLIENT_USER',
        reason: 'Viewer → CLIENT_USER: acceso a Posts y Proyectos (solo lectura)',
    },
];

async function main() {
    console.log('\n🔧  LEGACYMARK — FIX CUSTOM ROLES\n');
    console.log('─'.repeat(60));

    let updated = 0;
    let skipped = 0;

    for (const entry of ROLE_MAP) {
        const user = await prisma.user.findUnique({
            where: { email: entry.email },
            select: { id: true, email: true, role: true },
        });

        if (!user) {
            console.log(`⚠️  Usuario no encontrado: ${entry.email}`);
            skipped++;
            continue;
        }

        if (user.role.toLowerCase() !== entry.oldRole.toLowerCase()) {
            console.log(`⚠️  ${entry.email} tiene rol "${user.role}" (esperado: "${entry.oldRole}") — saltando`);
            skipped++;
            continue;
        }

        await prisma.user.update({
            where: { id: user.id },
            data: { role: entry.newRole },
        });

        console.log(`✅  ${entry.email}`);
        console.log(`    ${entry.oldRole} → ${entry.newRole}`);
        console.log(`    ${entry.reason}\n`);
        updated++;
    }

    console.log('─'.repeat(60));
    console.log(`\n📈  Resultado: ${updated} actualizado(s), ${skipped} saltado(s)`);

    if (updated > 0) {
        console.log('\n🔁  Verifica con:');
        console.log('    npx tsx scripts/testing/verify-rbac-matrix.ts\n');
    }
}

main()
    .catch(e => {
        console.error('\n❌ ERROR:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
