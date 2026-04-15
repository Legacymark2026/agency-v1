
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedDirect() {
    console.log('🌱 Seeding Inbox DIRECTLY (Bypassing Server Actions)...\n');

    const email = 'administrador@legacymark.com';
    const user = await prisma.user.findUnique({
        where: { email },
        include: { companies: true }
    });

    if (!user || user.companies.length === 0) {
        console.error('❌ User not found or no company.');
        return;
    }

    const companyId = user.companies[0].companyId;
    console.log(`🏢 Company ID: ${companyId}`);

    // Create Lead 1 (Instagram)
    let igLead = await prisma.lead.findFirst({
        where: { email: 'visita_ig@ejemplo.com', companyId }
    });

    if (!igLead) {
        igLead = await prisma.lead.create({
            data: {
                companyId,
                name: 'Sofia Trendy',
                email: 'visita_ig@ejemplo.com',
                source: 'INSTAGRAM',
                status: 'NEW'
            }
        });
    }

    // Conversation 1
    const igConv = await prisma.conversation.create({
        data: {
            companyId,
            leadId: igLead.id,
            channel: 'INSTAGRAM',
            status: 'OPEN',
            lastMessageAt: new Date(),
            lastMessagePreview: 'Hola, ¿tienen este producto en azul?',
            metadata: { platform: 'instagram' }
        }
    });

    await prisma.message.create({
        data: {
            conversationId: igConv.id,
            content: 'Hola, ¿tienen este producto en azul? 👗',
            direction: 'INBOUND',
            senderId: igLead.id,
            status: 'DELIVERED'
        }
    });

    // Create Lead 2 (Messenger)
    let fbLead = await prisma.lead.findFirst({
        where: { email: 'cliente_fb@ejemplo.com', companyId }
    });

    if (!fbLead) {
        fbLead = await prisma.lead.create({
            data: {
                companyId,
                name: 'Carlos Comprador',
                email: 'cliente_fb@ejemplo.com',
                source: 'FACEBOOK',
                status: 'NEW'
            }
        });
    }

    // Conversation 2
    const fbConv = await prisma.conversation.create({
        data: {
            companyId,
            leadId: fbLead.id,
            channel: 'MESSENGER',
            status: 'OPEN',
            lastMessageAt: new Date(),
            lastMessagePreview: 'Me interesa el servicio premium',
            metadata: { platform: 'messenger' }
        }
    });

    await prisma.message.create({
        data: {
            conversationId: fbConv.id,
            content: 'Me interesa el servicio premium. ¿Me pueden dar más info? 👋',
            direction: 'INBOUND',
            senderId: fbLead.id,
            status: 'DELIVERED'
        }
    });

    console.log('✅ Seeding complete! Check your inbox.');
}

seedDirect()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
