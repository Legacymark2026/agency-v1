import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function run() {
    try {
        const configs = await prisma.integrationConfig.findMany({});
        console.log("All Integrations found:", configs.length);
        configs.forEach(c => {
            console.log(`- Provider: ${c.provider} | Enabled: ${c.isEnabled} | Config:`, c.config);
        });
    } catch(e) {
        console.error(e);
    }
}
run();
