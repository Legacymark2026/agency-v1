
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function inspectConversations() {
    console.log('🕵️ INSPECTING REMAINING (REAL) CONVERSATIONS...\n');

    const email = 'administrador@legacymark.com';
    const user = await prisma.user.findUnique({
        where: { email },
        include: { companies: true }
    });

    if (!user || user.companies.length === 0) return;
    const companyId = user.companies[0].companyId;

    const conversations = await prisma.conversation.findMany({
        where: { companyId },
        include: {
            lead: true,
            messages: true
        }
    });

    console.log(`Found ${conversations.length} total conversations.`);

    conversations.forEach((conv, i) => {
        console.log(`\n--- CONVERSATION #${i + 1} ---`);
        console.log(`Lead:    ${conv.lead?.name} (${conv.lead?.email})`);
        console.log(`Channel: ${conv.channel}`);
        console.log(`Status:  ${conv.status}`);
        console.log(`Messages Count: ${conv.messages.length}`);

        if (conv.messages.length > 0) {
            console.log('Messages:');
            conv.messages.forEach(msg => {
                console.log(`   [${msg.direction}] ${msg.createdAt.toISOString()}: ${msg.content?.substring(0, 50)}`);
            });
        } else {
            console.log('⚠️  NO MESSAGES. (This is why it might look empty)');
        }
    });
}


inspectConversations()
    .catch(console.error)
    .finally(async () => await prisma.$disconnect());
