import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkConfig() {
    console.log("Checking IntegrationConfig for Facebook...");
    const configs = await prisma.integrationConfig.findMany({
        where: { provider: 'facebook' }
    });

    console.log(`Found ${configs.length} Facebook configs.`);
    for (const c of configs) {
        const conf = c.config as any;
        console.log(`Company: ${c.companyId}`);
        console.log(`  accessToken: ${conf?.accessToken ? 'Set' : 'MISSING'}`);
    }

    console.log("\nChecking Accounts for Facebook...");
    const accounts = await prisma.account.findMany({
        where: { provider: 'facebook' },
        include: { user: { select: { email: true, name: true } } }
    });

    console.log(`Found ${accounts.length} Facebook accounts connected to users.`);
    for (const a of accounts) {
        console.log(`User: ${a.user.email} (${a.user.name})`);
        
        if (a.access_token) {
           try {
             console.log("\n--- API CHECKS ---");
             const permRes = await fetch(`https://graph.facebook.com/v19.0/me/permissions?access_token=${a.access_token}`);
             const permJson = await permRes.json();
             console.log(`Permissions granted:`);
             if (permJson.data) {
                 permJson.data.forEach((p: any) => console.log(` - ${p.permission}: ${p.status}`));
             } else {
                 console.log(permJson);
             }

             const pagesRes = await fetch(`https://graph.facebook.com/v19.0/me/accounts?access_token=${a.access_token}`);
             const pagesJson = await pagesRes.json();
             console.log(`\nPages returned by API (/me/accounts):`);
             if (pagesJson.data) {
                 console.log(`Count: ${pagesJson.data.length}`);
                 pagesJson.data.forEach((page: any) => console.log(` - ${page.name} (${page.id})`));
             } else {
                 console.log(pagesJson);
             }

           } catch(e: any) {
             console.log(`  Check Failed: ${e.message}`);
           }
        }
    }
}

checkConfig().finally(() => prisma.$disconnect());
