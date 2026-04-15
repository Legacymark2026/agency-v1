import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

interface WhatsAppMessage {
    from: string;
    id: string;
    timestamp: string;
    text?: { body: string };
    type: string;
    image?: { id: string; mime_type: string; sha256: string; caption?: string };
}

interface WhatsAppContact {
    profile: { name: string };
    wa_id: string;
}

interface WhatsAppMetadata {
    display_phone_number: string;
    phone_number_id: string;
}

export async function handleIncomingWhatsAppMessage({
    message,
    contact,
    metadata
}: {
    message: WhatsAppMessage;
    contact: WhatsAppContact;
    metadata: WhatsAppMetadata;
}) {
    try {
        console.log(`[WhatsApp Service] Processing message from ${contact.wa_id}`);

        // 1. Find the Company associated with this Receiver Phone Number
        // We need to look up IntegrationConfigs where config->phoneNumberId matches
        // Prisma doesn't always support JSON filtering easily across all DBs, 
        // but for Postgres it works. If not, we might need to fetch all WA configs and filter in memory (not efficient but checking)
        // Let's try raw query or efficiently fetch configs.

        // Strategy: Fetch all enabled whatsapp configs (usually few) and match.
        const configs = await prisma.integrationConfig.findMany({
            where: {
                provider: 'whatsapp',
                isEnabled: true
            },
            include: { company: true }
        });

        const targetConfig = configs.find(c => {
            const json = c.config as any;
            return json?.phoneNumberId === metadata.phone_number_id;
        });

        if (!targetConfig) {
            console.error(`[WhatsApp Service] No company found for phone ID: ${metadata.phone_number_id}`);
            return { error: "Company not found" };
        }

        const companyId = targetConfig.companyId;

        // 2. Check for Deduplication
        const existingMessage = await prisma.message.findFirst({
            where: { externalId: message.id }
        });

        if (existingMessage) {
            console.log(`[WhatsApp Service] Message ${message.id} already processed.`);
            return { success: true, deduplicated: true };
        }

        // 3. Find or Create Lead
        let lead = await prisma.lead.findFirst({
            where: {
                companyId,
                phone: { contains: contact.wa_id } // Simplistic matching
            }
        });

        if (!lead) {
            lead = await prisma.lead.create({
                data: {
                    companyId,
                    name: contact.profile.name,
                    phone: contact.wa_id,
                    email: `${contact.wa_id}@whatsapp.user`, // Dummy email
                    source: "WHATSAPP",
                    status: "NEW"
                }
            });
            console.log(`[WhatsApp Service] Created new Lead: ${lead.id}`);
        }

        // 4. Find or Create Conversation
        let conversation = await prisma.conversation.findUnique({
            where: {
                platformId_channel: {
                    platformId: contact.wa_id,
                    channel: 'WHATSAPP'
                }
            }
        });

        if (!conversation) {
            conversation = await prisma.conversation.create({
                data: {
                    companyId,
                    channel: 'WHATSAPP',
                    platformId: contact.wa_id,
                    leadId: lead.id,
                    status: 'OPEN',
                    lastMessageAt: new Date(),
                    unreadCount: 1,
                    metadata: {
                        wa_name: contact.profile.name
                    }
                }
            });
        } else {
            // Update conversation stats
            await prisma.conversation.update({
                where: { id: conversation.id },
                data: {
                    lastMessageAt: new Date(),
                    unreadCount: { increment: 1 },
                    status: conversation.status === 'ARCHIVED' ? 'OPEN' : conversation.status
                }
            });
        }

        // 5. Create Message
        let content = "";
        let msgType = "TEXT";

        if (message.type === 'text') {
            content = message.text?.body || "";
        } else if (message.type === 'image') {
            msgType = "IMAGE";
            content = message.image?.caption || "Image";
            // TODO: Download image media if needed using media API
        } else {
            content = `[${message.type.toUpperCase()} MESSAGE]`;
        }

        await prisma.message.create({
            data: {
                conversationId: conversation.id,
                direction: 'INBOUND',
                status: 'DELIVERED',
                type: msgType,
                content: content,
                externalId: message.id,
                metadata: message as any
            }
        });

        console.log(`[WhatsApp Service] Message saved successfully.`);

        // Revalidate UI
        revalidatePath('/dashboard/inbox');

        return { success: true };

    } catch (error) {
        console.error("[WhatsApp Service] Error processing message:", error);
        return { error: "Processing failed" };
    }
}
