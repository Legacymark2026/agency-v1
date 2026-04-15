
import { prisma } from "../lib/prisma";

async function main() {
    console.log("Verifying WhatsApp Data...");
    try {
        const leads = await prisma.lead.findMany({
            where: { source: 'WHATSAPP' },
            orderBy: { createdAt: 'desc' },
            take: 1
        });
        console.log(`Found ${leads.length} WhatsApp leads.`);
        if (leads.length > 0) {
            console.log('Last Lead:', JSON.stringify(leads[0], null, 2));
        }

        const conversations = await prisma.conversation.findMany({
            where: { channel: 'WHATSAPP' },
            include: { messages: true },
            orderBy: { createdAt: 'desc' },
            take: 1
        });
        console.log(`Found ${conversations.length} WhatsApp conversations.`);
        if (conversations.length > 0) {
            console.log('Last Conversation:', JSON.stringify(conversations[0], null, 2));
        }
    } catch (error) {
        console.error("Error verifying data:", error);
    }
}
main();
