import { prisma } from '../lib/prisma';

async function main() {
    console.log("🚀 Checking Inbox Conversations...");

    const companyId = "839e33e6-307b-4100-b9c3-b21e17a89295";

    const conversations = await prisma.conversation.findMany({
        where: { companyId },
        include: {
            lead: true,
            messages: true
        }
    });

    console.log(`\n📄 Found ${conversations.length} conversations for Company ${companyId}`);

    for (const conv of conversations) {
        console.log(`\n------------------------------------------------`);
        console.log(`🆔 ID: ${conv.id}`);
        console.log(`👤 Lead: ${conv.lead?.name} (${conv.lead?.email})`);
        console.log(`📢 Channel: ${conv.channel}`);
        console.log(`📅 Last Message: ${conv.lastMessageAt}`);
        console.log(`💬 Messages: ${conv.messages.length}`);

        conv.messages.forEach(msg => {
            console.log(`   [${msg.direction}] ${msg.content?.substring(0, 50) ?? "(sin contenido)"}...`);
        });
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
