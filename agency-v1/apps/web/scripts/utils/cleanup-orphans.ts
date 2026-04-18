
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupOrphans() {
    console.log('🧹 Cleaning up orphan/simulated conversations...');

    // 1. Find conversations with no Lead
    const orphans = await prisma.conversation.findMany({
        where: {
            leadId: null
        }
    });

    if (orphans.length > 0) {
        console.log(`Found ${orphans.length} orphan conversations (missing leads). Deleting...`);
        await prisma.conversation.deleteMany({
            where: {
                id: { in: orphans.map(c => c.id) }
            }
        });
    }

    // 2. Find conversations that might still be simulated but have a lead (just in case)
    // Deleting via specific messages content to be sure
    const simulatedMessages = [
        'Hola, ¿tienen este producto en azul? 👗',
        'Me interesa el servicio premium. ¿Me pueden dar más info? 👋'
    ];

    const simConvos = await prisma.conversation.findMany({
        where: {
            messages: {
                some: {
                    content: { in: simulatedMessages }
                }
            }
        }
    });

    if (simConvos.length > 0) {
        console.log(`Found ${simConvos.length} remaining simulated conversations. Deleting...`);
        await prisma.conversation.deleteMany({
            where: {
                id: { in: simConvos.map(c => c.id) }
            }
        });
    }

    console.log('✅ Cleanup complete. Only REAL conversations remain.');
}

cleanupOrphans()
    .catch(console.error)
    .finally(async () => await prisma.$disconnect());
