import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function diagnose() {
    console.log('--- DETECCIÓN DE ERRORES DE INTEGRACIÓN ---');
    
    // Check IntegrationLogs
    const logs = await prisma.integrationLog.findMany({
        where: { integration: 'META' },
        orderBy: { checkedAt: 'desc' },
        take: 10
    });

    console.log('\nÚltimos 10 logs de integración (META):');
    if (logs.length === 0) console.log('Sin logs encontrados.');
    logs.forEach(log => {
        const icon = log.status === 'OK' ? '✅' : '❌';
        console.log(`${icon} [${log.checkedAt.toISOString()}] Status: ${log.status} | Msg: ${log.message}`);
    });

    // Check WebhookEvents
    const webhooks = await prisma.webhookEvent.findMany({
        where: { platform: 'META' },
        orderBy: { createdAt: 'desc' },
        take: 10
    });

    console.log('\nÚltimos 10 eventos de webhook (META):');
    if (webhooks.length === 0) console.log('Sin eventos encontrados.');
    webhooks.forEach(event => {
        console.log(`- [${event.createdAt.toISOString()}] Type: ${event.eventType} | Processed: ${event.processedAt ? '✅' : '❌'}`);
    });

    // Check Accounts for Meta
    const accounts = await prisma.account.findMany({
        where: { provider: 'facebook' },
        include: { user: { select: { email: true } } }
    });

    console.log('\nCuentas vinculadas a Facebook:');
    accounts.forEach(acc => {
        const hasToken = !!acc.access_token;
        console.log(`- User: ${acc.user.email} | Token: ${hasToken ? '✅' : '❌'} | Scopes: ${acc.scope}`);
    });
}

diagnose()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
