
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function purgeSimulated() {
    console.log('🧹 Purging simulated data...');

    const emails = ['visita_ig@ejemplo.com', 'cliente_fb@ejemplo.com', 'ig-123@social.user', 'fb-123@social.user'];

    // Delete Conversatios & Messages (Cascade usually handles messages, but we'll be safe)
    // Deleting Leads will cascade to Conversations
    const { count } = await prisma.lead.deleteMany({
        where: {
            email: { in: emails }
        }
    });

    console.log(`✅ Deleted ${count} simulated leads (and their chats).`);
    console.log('Now your inbox should ONLY contain real data.');
}

purgeSimulated()
    .catch(console.error)
    .finally(async () => await prisma.$disconnect());
