
import { prisma } from "../lib/prisma";

console.log("Starting simple verification...");

async function main() {
    console.log("Checking database for ANY recent leads...");
    try {
        const leads = await prisma.lead.findMany({
            orderBy: { createdAt: 'desc' },
            take: 5
        });
        console.log(`Found ${leads.length} recent leads.`);
        leads.forEach(l => console.log(`- ${l.name} (${l.phone}) [Source: ${l.source}]`));

        const convs = await prisma.conversation.findMany({
            orderBy: { createdAt: 'desc' },
            take: 5
        });
        console.log(`Found ${convs.length} recent conversations.`);
        convs.forEach(c => console.log(`- ${c.platformId} [Channel: ${c.channel}]`));

    } catch (error) {
        console.error("Error:", error);
    }
}

main();
