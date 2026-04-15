/**
 * restore-custom-roles.ts
 * ─────────────────────────────────────────────────────
 * Restaura los roles custom originales a los usuarios.
 * Ahora que lib/rbac.ts tiene CUSTOM_ROLE_PERMISSIONS,
 * los roles custom funcionan correctamente.
 *
 * Uso:
 *   npx tsx scripts/testing/restore-custom-roles.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const RESTORE_MAP = [
    {
        email: 'nestoreiangarcia@legacymarksas.com',
        fromRole: 'CLIENT_ADMIN',
        toRole: 'gerente',
        reason: 'Restaurando rol custom: gerente → acceso a Analytics, Inbox, CRM, Marketing',
    },
    {
        email: 'hebohorquez@uts.edu.co',
        fromRole: 'CLIENT_USER',
        toRole: 'viewer',
        reason: 'Restaurando rol custom: viewer → acceso a Posts y Proyectos',
    },
];

async function main() {
    console.log('\n🔁  LEGACYMARK — RESTAURAR ROLES CUSTOM\n');
    console.log('─'.repeat(60));

    for (const entry of RESTORE_MAP) {
        const user = await prisma.user.findUnique({
            where: { email: entry.email },
            select: { id: true, email: true, role: true },
        });

        if (!user) {
            console.log(`⚠️  No encontrado: ${entry.email}`);
            continue;
        }

        await prisma.user.update({
            where: { id: user.id },
            data: { role: entry.toRole },
        });

        console.log(`✅  ${entry.email}`);
        console.log(`    ${entry.fromRole} → ${entry.toRole}`);
        console.log(`    ${entry.reason}\n`);
    }

    console.log('─'.repeat(60));
    console.log('\n🔁  Verifica con:');
    console.log('    npx tsx scripts/testing/verify-rbac-matrix.ts\n');
}

main()
    .catch(e => { console.error('\n❌ ERROR:', e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });
