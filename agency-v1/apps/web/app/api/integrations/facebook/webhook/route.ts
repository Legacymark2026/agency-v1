import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createLead } from '@/actions/crm';
import { sendMetaCapiEvent } from '@/lib/meta-capi';

/**
 * Facebook Webhook Route
 * 
 * Used for:
 * 1. GET: Webhook Verification (Meta expects a 200 with hub.challenge)
 * 2. POST: Receiving Leadgen notifications in real-time
 * 3. POST: Receiving Messaging notifications (Messenger/Instagram)
 */

// Meta Verification Handler (GET)
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    console.log(`[Meta Webhook] Validation Attempt - Mode: ${mode}, Token: ${token}`);

    const VERIFY_TOKEN = 
        process.env.META_WEBHOOK_VERIFY_TOKEN || 
        process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN || 
        'legacymark_meta_sync';

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('[Meta Webhook] Verification successful. Returning challenge:', challenge);
        // Meta requires the challenge to be returned exactly as is, as plain text.
        return new Response(challenge, {
            status: 200,
            headers: {
                'Content-Type': 'text/plain',
            },
        });
    }

    console.warn('[Meta Webhook] Verification failed: Invalid token or mode');
    return new Response('Forbidden', { status: 403 });
}

// Leadgen Notification Handler (POST)
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        console.log('[Meta Webhook] Received notification:', JSON.stringify(body, null, 2));

        // Meta sends updates for 'leadgen' field
        if (body.object === 'page') {
            for (const entry of body.entry) {
                const pageId = entry.id;
                
                for (const change of entry.changes) {
                    const field = change.field;
                    
                    // ===============================================
                    // HANDLER: Messaging (Messenger & Instagram)
                    // ===============================================
                    if (field === 'messaging' || field === 'messages') {
                        const messagingEvent = change.value;
                        await handleIncomingMessage(messagingEvent, pageId);
                        continue;
                    }

                    // ===============================================
                    // HANDLER: Messaging Postbacks (Buttons/Menus)
                    // ===============================================
                    if (field === 'messaging_postbacks') {
                        await handleMessagingPostback(change.value, pageId);
                        continue;
                    }

                    // ===============================================
                    // HANDLER: Message Deliveries (Confirmations)
                    // ===============================================
                    if (field === 'message_deliveries') {
                        await handleMessageDelivery(change.value, pageId);
                        continue;
                    }

                    // ===============================================
                    // HANDLER: Message Reads (Read Receipts)
                    // ===============================================
                    if (field === 'message_reads') {
                        await handleMessageRead(change.value, pageId);
                        continue;
                    }

                    // ===============================================
                    // HANDLER: Messaging Seen (Instagram Read Status)
                    // ===============================================
                    if (field === 'messaging_seen') {
                        await handleMessageSeen(change.value, pageId);
                        continue;
                    }

                    // ===============================================
                    // HANDLER: Feed (Posts, Comments, Likes)
                    // ===============================================
                    if (field === 'feed') {
                        await handleFeedChange(change.value, pageId);
                        continue;
                    }

                    // ===============================================
                    // HANDLER: Ratings (Star Reviews)
                    // ===============================================
                    if (field === 'ratings') {
                        await handleRatingChange(change.value, pageId);
                        continue;
                    }

                    // ===============================================
                    // HANDLER: Mentions (Page Tagged)
                    // ===============================================
                    if (field === 'mention') {
                        await handleMentionChange(change.value, pageId);
                        continue;
                    }

                    // ===============================================
                    // HANDLER: Conversations (Thread Changes)
                    // ===============================================
                    if (field === 'conversations') {
                        await handleConversationChange(change.value, pageId);
                        continue;
                    }

                    // ===============================================
                    // HANDLER: Leadgen (Facebook Ads Forms)
                    // ===============================================
                    if (field === 'leadgen') {
                        const { leadgen_id, page_id, adgroup_id, ad_id, form_id, created_time } = change.value;

                        console.log(`[Meta Webhook] New lead detected: ID ${leadgen_id} / Form ${form_id}`);

                        // 1. Find the company associated with this Page ID
                        const config = await prisma.integrationConfig.findFirst({
                            where: {
                                provider: 'facebook',
                                config: {
                                    path: ['pageId'],
                                    equals: page_id,
                                },
                            },
                        });

                        if (!config) {
                            console.error(`[Meta Webhook] No company found for Page ID ${page_id}`);
                            continue;
                        }

                        const fbConfig = config.config as any;
                        const accessToken = fbConfig.accessToken;

                        // 2. Fetch full lead data from Meta Graph API
                        const leadResponse = await fetch(`https://graph.facebook.com/v19.0/${leadgen_id}?access_token=${accessToken}`);
                        const leadData = await leadResponse.json();

                        if (!leadResponse.ok) {
                            console.error('[Meta Webhook] Failed to fetch lead data:', leadData);
                            continue;
                        }

                        // 3. Extract field values (Email, Name, Phone, etc.)
                        const fields = leadData.field_data || [];
                        const emailField = fields.find((f: any) => f.name === 'email' || f.name === 'EMAIL');
                        const nameField = fields.find((f: any) => f.name === 'full_name' || f.name === 'FULL_NAME' || f.name === 'name');
                        const phoneField = fields.find((f: any) => f.name === 'phone_number' || f.name === 'PHONE');

                        const email = emailField?.values[0] || '';
                        const name = nameField?.values[0] || '';
                        const phone = phoneField?.values[0] || '';

                        if (email) {
                            // 4. Create lead in LegacyMark CRM
                            await createLead({
                                email,
                                name,
                                phone,
                                source: 'FACEBOOK_ADS',
                                message: `Lead automático de Facebook (Form: ${form_id})`,
                                companyId: config.companyId,
                                formData: {
                                    meta_lead_id: leadgen_id,
                                    meta_form_id: form_id,
                                    meta_ad_id: ad_id,
                                    meta_adgroup_id: adgroup_id,
                                    raw_meta_data: leadData,
                                }
                            });
                            console.log(`[Meta Webhook] Lead ${email} created from Facebook Ads.`);

                            // 5. Trigger Meta CAPI Lead Event for immediate optimization
                            const pixelId = fbConfig.pixelId;
                            const capiToken = fbConfig.capiToken;

                            if (pixelId && capiToken) {
                                await sendMetaCapiEvent({
                                    pixelId,
                                    accessToken: capiToken,
                                    eventName: 'Lead',
                                    userData: {
                                        email,
                                        phone,
                                        firstName: name?.split(' ')[0],
                                        lastName: name?.split(' ').slice(1).join(' '),
                                    },
                                    customData: {
                                        lead_event_source: 'WEBHOOK',
                                        form_id: form_id
                                    }
                                });
                                console.log('[Meta Webhook] CAPI Lead event sent.');
                            }
                        }
                    }
                }
            }
        }

        // ===============================================
        // HANDLER: Instagram (Comments & Mentions)
        // ===============================================
        if (body.object === 'instagram') {
            for (const entry of body.entry) {
                for (const change of entry.changes) {
                    if (change.field === 'comments') {
                        await handleInstagramComment(change.value, entry.id);
                    }
                    if (change.field === 'mentions') {
                        await handleInstagramMention(change.value, entry.id);
                    }
                }
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[Meta Webhook] Handler error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// ===============================================
// HELPER: Handle Incoming Messages (Messenger/Instagram)
// ===============================================
async function handleIncomingMessage(event: any, pageId: string) {
    console.log('[Meta Webhook] Processing incoming message:', JSON.stringify(event, null, 2));

    const sender = event.sender;
    const recipient = event.recipient;
    const message = event.message;
    const timestamp = event.timestamp;

    if (!sender?.id || !message) {
        console.log('[Meta Webhook] Skipping event - missing sender or message');
        return;
    }

    // Determine platform (Instagram vs Messenger)
    const isInstagram = recipient?.id?.startsWith('178414');
    const platform = isInstagram ? 'INSTAGRAM' : 'MESSENGER';
    console.log(`[Meta Webhook] Platform detected: ${platform}`);

    // 1. Find company config for this page
    // Try to find by pageId in JSON config, fallback to any facebook config
    let config = await prisma.integrationConfig.findFirst({
        where: {
            provider: 'facebook',
            isEnabled: true,
        },
    });

    if (!config) {
        console.error(`[Meta Webhook] No facebook config found at all`);
        return;
    }

    // Check if pageId matches in config
    const fbConfig = config.config as any;
    if (fbConfig.pageId && fbConfig.pageId !== pageId) {
        console.log(`[Meta Webhook] Config pageId ${fbConfig.pageId} doesn't match webhook pageId ${pageId}, using anyway`);
    }

    const companyId = config.companyId;

    // 2. Find or Create Lead
    const leadEmail = `${platform.toLowerCase()}-${sender.id}@social.user`;
    let lead = await prisma.lead.findFirst({
        where: { companyId, email: leadEmail }
    });

    if (!lead) {
        lead = await prisma.lead.create({
            data: {
                companyId,
                name: message.from?.name || `User ${sender.id}`,
                email: leadEmail,
                source: platform,
                status: 'NEW',
                tags: [`${platform.toLowerCase()}-inbound`]
            }
        });
        console.log(`[Meta Webhook] Created new lead for ${platform} user`);
    }

    // 3. Find or Create Conversation
    let conversation = await prisma.conversation.findFirst({
        where: { companyId, leadId: lead.id, channel: platform }
    });

    if (!conversation) {
        const messageTimestamp = timestamp ? new Date(timestamp) : new Date();
        conversation = await prisma.conversation.create({
            data: {
                companyId,
                leadId: lead.id,
                channel: platform,
                status: 'OPEN',
                lastMessageAt: isNaN(messageTimestamp.getTime()) ? new Date() : messageTimestamp,
                lastMessagePreview: message.text?.substring(0, 100) || '[Media]',
                metadata: {
                    pageId: pageId,
                    recipientId: recipient?.id,
                    senderId: sender.id,
                    threadId: event.thread_id || recipient?.id
                }
            }
        });
        console.log(`[Meta Webhook] Created new conversation for ${platform}`);
    }

    // 4. Create Message
    const messageContent = message.text || '[Media/Attachment]';
    
    // Check if message already exists to avoid duplicates
    const msgTimestamp = timestamp ? new Date(timestamp) : new Date();
    const validMsgTimestamp = isNaN(msgTimestamp.getTime()) ? new Date() : msgTimestamp;

    const existingMessage = await prisma.message.findFirst({
        where: {
            conversationId: conversation.id,
            content: messageContent,
            createdAt: {
                gte: new Date(validMsgTimestamp.getTime() - 5000),
                lte: new Date(validMsgTimestamp.getTime() + 5000)
            }
        }
    });

    if (!existingMessage) {
        await prisma.message.create({
            data: {
                conversationId: conversation.id,
                content: messageContent,
                direction: 'INBOUND',
                status: 'DELIVERED',
                senderId: lead.id,
                createdAt: validMsgTimestamp
            }
        });
        console.log(`[Meta Webhook] Message saved to conversation ${conversation.id}`);

        // 5. Update conversation last message
        await prisma.conversation.update({
            where: { id: conversation.id },
            data: {
                lastMessageAt: validMsgTimestamp,
                lastMessagePreview: messageContent.substring(0, 100)
            }
        });

        // 6. Trigger AI Agent for auto-response (if enabled)
        try {
            const { triggerOmnichannelAgent } = await import('@/lib/services/ai-inbox');
            triggerOmnichannelAgent(conversation.id, companyId).catch(err => 
                console.error('[Meta Webhook] AI Trigger failed:', err)
            );
        } catch (err) {
            console.log('[Meta Webhook] AI trigger not available, skipping');
        }
    } else {
        console.log('[Meta Webhook] Duplicate message detected, skipping');
    }
}

// ===============================================
// HELPER: Handle Messaging Postbacks (Buttons/Menus)
// ===============================================
async function handleMessagingPostback(event: any, pageId: string) {
    console.log('[Meta Webhook] Processing messaging postback:', JSON.stringify(event, null, 2));
    
    const sender = event.sender;
    const postback = event.postback;
    const timestamp = event.timestamp;
    
    if (!sender?.id || !postback) {
        console.log('[Meta Webhook] Skipping postback - missing data');
        return;
    }
    
    const payload = postback.payload;
    const title = postback.title;
    
    console.log(`[Meta Webhook] Postback received: ${title} (payload: ${payload})`);
    
    // Find company config
    const config = await prisma.integrationConfig.findFirst({
        where: {
            provider: 'facebook',
            config: { path: ['pageId'], equals: pageId }
        }
    });
    
    if (!config) {
        console.error(`[Meta Webhook] No config found for page ${pageId}`);
        return;
    }
    
    const companyId = config.companyId;
    const platform = 'MESSENGER';
    
    // Find or create lead/conversation
    const leadEmail = `messenger-${sender.id}@social.user`;
    let lead = await prisma.lead.findFirst({ where: { companyId, email: leadEmail } });
    
    if (!lead) {
        lead = await prisma.lead.create({
            data: {
                companyId,
                name: `User ${sender.id}`,
                email: leadEmail,
                source: platform,
                status: 'NEW',
                tags: ['messenger-postback']
            }
        });
    }
    
    let conversation = await prisma.conversation.findFirst({
        where: { companyId, leadId: lead.id, channel: platform }
    });
    
    if (!conversation) {
        conversation = await prisma.conversation.create({
            data: {
                companyId,
                leadId: lead.id,
                channel: platform,
                status: 'OPEN',
                lastMessageAt: new Date(timestamp),
                lastMessagePreview: `Postback: ${title}`,
                metadata: { pageId, senderId: sender.id, payload }
            }
        });
    }
    
    // Save postback as message
    await prisma.message.create({
        data: {
            conversationId: conversation.id,
            content: `[Postback clicked]: ${title} (Payload: ${payload})`,
            direction: 'INBOUND',
            status: 'DELIVERED',
            senderId: lead.id,
            metadata: { payload, title },
            createdAt: new Date(timestamp)
        }
    });
    
    // Trigger AI
    try {
        const { triggerOmnichannelAgent } = await import('@/lib/services/ai-inbox');
        triggerOmnichannelAgent(conversation.id, companyId).catch(console.error);
    } catch (err) {}
}

// ===============================================
// HELPER: Handle Message Deliveries (Confirmations)
// ===============================================
async function handleMessageDelivery(event: any, pageId: string) {
    console.log('[Meta Webhook] Processing message delivery:', JSON.stringify(event, null, 2));
    
    const delivery = event.delivery;
    if (!delivery?.watermark) return;
    
    const timestamp = delivery.timestamp;
    const messageIds = delivery.messaging || [];
    
    console.log(`[Meta Webhook] Delivery confirmation for ${messageIds.length} messages at ${timestamp}`);
    
    // Update message statuses to DELIVERED
    const deliveryTime = new Date(timestamp);
    
    for (const msgId of messageIds) {
        await prisma.message.updateMany({
            where: {
                externalId: msgId,
                status: { in: ['SENT', 'PENDING'] }
            },
            data: { status: 'DELIVERED' }
        });
    }
}

// ===============================================
// HELPER: Handle Message Reads (Read Receipts)
// ===============================================
async function handleMessageRead(event: any, pageId: string) {
    console.log('[Meta Webhook] Processing message read:', JSON.stringify(event, null, 2));
    
    const read = event.read;
    if (!read?.watermark) return;
    
    const timestamp = read.timestamp;
    const messageIds = read.messages || [];
    
    console.log(`[Meta Webhook] Read receipt for ${messageIds.length} messages at ${timestamp}`);
    
    // Update message statuses to READ
    const readTime = new Date(timestamp);
    
    for (const msgId of messageIds) {
        await prisma.message.updateMany({
            where: { externalId: msgId },
            data: { status: 'READ' }
        });
        
        // Update conversation
        await prisma.conversation.updateMany({
            where: { metadata: { path: ['pageId'], equals: pageId } },
            data: { unreadCount: 0 }
        });
    }
}

// ===============================================
// HELPER: Handle Messaging Seen (Instagram Read Status)
// ===============================================
async function handleMessageSeen(event: any, pageId: string) {
    console.log('[Meta Webhook] Processing messaging seen (Instagram):', JSON.stringify(event, null, 2));
    
    const seen = event.seen;
    if (!seen?.watermark) return;
    
    const timestamp = seen.timestamp;
    const messageIds = seen.messages || [];
    
    console.log(`[Meta Webhook] Instagram seen for ${messageIds.length} messages`);
    
    // Same as message_reads - mark as READ
    for (const msgId of messageIds) {
        await prisma.message.updateMany({
            where: { externalId: msgId },
            data: { status: 'READ' }
        });
    }
}

// ===============================================
// HELPER: Handle Feed Changes (Posts, Comments, Likes)
// ===============================================
async function handleFeedChange(event: any, pageId: string) {
    console.log('[Meta Webhook] Processing feed change:', JSON.stringify(event, null, 2));
    
    const feedItem = event.feed_target_id || event.message_id;
    const messageType = event.message_type;
    const senderName = event.from?.name || 'Unknown';
    
    console.log(`[Meta Webhook] Feed event: ${messageType} from ${senderName}`);
    
    // Find company config
    const config = await prisma.integrationConfig.findFirst({
        where: {
            provider: 'facebook',
            config: { path: ['pageId'], equals: pageId }
        }
    });
    
    if (!config) return;
    
    const companyId = config.companyId;
    
    // Create notification for admin dashboard (optional - could create a Task or Notification)
    console.log(`[Meta Webhook] Feed change logged: ${messageType} - ${feedItem}`);
    
    // Create lead if it's a new comment/message
    if (messageType === 'comment' || messageType === 'status_message') {
        const content = event.message || event.comment_id;
        
        // Could create a lead or task here
        console.log(`[Meta Webhook] New post/comment: ${content?.substring(0, 50)}`);
    }
}

// ===============================================
// HELPER: Handle Rating Changes (Star Reviews)
// ===============================================
async function handleRatingChange(event: any, pageId: string) {
    console.log('[Meta Webhook] Processing rating change:', JSON.stringify(event, null, 2));
    
    const ratingId = event.rating_id;
    const ratingValue = event.rating_value;
    const commentId = event.comment_id;
    const reviewerName = event.reviewer_name || 'Anonymous';
    
    console.log(`[Meta Webhook] New rating: ${ratingValue} stars from ${reviewerName}`);
    
    // Find company config
    const config = await prisma.integrationConfig.findFirst({
        where: {
            provider: 'facebook',
            config: { path: ['pageId'], equals: pageId }
        }
    });
    
    if (!config) return;
    
    const companyId = config.companyId;
    
    // Create a lead or task for the review
    const leadEmail = `review-${ratingId}@social.user`;
    await prisma.lead.upsert({
        where: { companyId_email: { companyId, email: leadEmail } },
        update: {},
        create: {
            companyId,
            name: reviewerName,
            email: leadEmail,
            source: 'FACEBOOK_REVIEW',
            status: 'NEW',
            message: `Rating: ${ratingValue} stars. Comment ID: ${commentId}`,
            tags: ['facebook-review']
        }
    });
    
    console.log(`[Meta Webhook] Lead created for review from ${reviewerName}`);
}

// ===============================================
// HELPER: Handle Mention Changes (Page Tagged)
// ===============================================
async function handleMentionChange(event: any, pageId: string) {
    console.log('[Meta Webhook] Processing mention change:', JSON.stringify(event, null, 2));
    
    const mentionId = event.mention_id;
    const message = event.message || '';
    const senderName = event.from?.name || 'Unknown';
    const senderId = event.from?.id;
    
    console.log(`[Meta Webhook] Page mentioned by ${senderName}: ${message?.substring(0, 50)}`);
    
    // Find company config
    const config = await prisma.integrationConfig.findFirst({
        where: {
            provider: 'facebook',
            config: { path: ['pageId'], equals: pageId }
        }
    });
    
    if (!config) return;
    
    const companyId = config.companyId;
    
    // Create lead for the mention
    const leadEmail = `mention-${senderId}@social.user`;
    await prisma.lead.upsert({
        where: { companyId_email: { companyId, email: leadEmail } },
        update: {},
        create: {
            companyId,
            name: senderName,
            email: leadEmail,
            source: 'FACEBOOK_MENTION',
            status: 'NEW',
            message: `Mentioned on page: ${message}`,
            tags: ['facebook-mention']
        }
    });
}

// ===============================================
// HELPER: Handle Conversation Changes
// ===============================================
async function handleConversationChange(event: any, pageId: string) {
    console.log('[Meta Webhook] Processing conversation change:', JSON.stringify(event, null, 2));
    
    const threadId = event.thread_id;
    const changeType = event.change_type;
    
    console.log(`[Meta Webhook] Conversation ${threadId} changed: ${changeType}`);
    
    // Could handle thread archival, deletion, etc.
}

// ===============================================
// HELPER: Handle Instagram Comments
// ===============================================
async function handleInstagramComment(event: any, instagramAccountId: string) {
    console.log('[Meta Webhook] Processing Instagram comment:', JSON.stringify(event, null, 2));
    
    const commentId = event.comment_id;
    const text = event.text || '';
    const username = event.from?.username || 'unknown';
    const userId = event.from?.id;
    
    console.log(`[Meta Webhook] Instagram comment from ${username}: ${text?.substring(0, 50)}`);
    
    // Find company config
    let config = await prisma.integrationConfig.findFirst({
        where: {
            provider: 'facebook',
            config: { path: ['instagramAccountId'], equals: instagramAccountId }
        }
    });
    
    if (!config) {
        // Try finding by page
        const altConfig = await prisma.integrationConfig.findFirst({
            where: { provider: 'facebook' }
        });
        if (altConfig) {
            config = altConfig;
        }
    }
    
    if (!config) return;
    
    const companyId = config.companyId;
    
    // Create lead for comment
    const leadEmail = `instagram-comment-${userId}@social.user`;
    const lead = await prisma.lead.upsert({
        where: { companyId_email: { companyId, email: leadEmail } },
        update: {},
        create: {
            companyId,
            name: username,
            email: leadEmail,
            source: 'INSTAGRAM',
            status: 'NEW',
            message: `Comment on post: ${text}`,
            tags: ['instagram-comment']
        }
    });
    
    // Create conversation
    const conversation = await prisma.conversation.upsert({
        where: { id: `ig-comment-${commentId}` },
        update: {},
        create: {
            id: `ig-comment-${commentId}`,
            companyId,
            leadId: lead.id,
            channel: 'INSTAGRAM',
            status: 'OPEN',
            lastMessageAt: new Date(),
            lastMessagePreview: text?.substring(0, 100) || '[Image/Video]',
            metadata: { commentId, instagramAccountId }
        }
    });
    
    // Save comment as message
    await prisma.message.create({
        data: {
            conversationId: conversation.id,
            content: text || '[Media/Image]',
            direction: 'INBOUND',
            status: 'DELIVERED',
            senderId: lead.id,
            metadata: { commentId }
        }
    });
    
    console.log(`[Meta Webhook] Instagram comment saved`);
}

// ===============================================
// HELPER: Handle Instagram Mentions
// ===============================================
async function handleInstagramMention(event: any, instagramAccountId: string) {
    console.log('[Meta Webhook] Processing Instagram mention:', JSON.stringify(event, null, 2));
    
    const mentionId = event.mention_id;
    const mediaType = event.media_type || 'post';
    const username = event.from?.username || 'unknown';
    const userId = event.from?.id;
    
    console.log(`[Meta Webhook] Instagram mention from ${username} (${mediaType})`);
    
    // Similar to comments - create lead and notification
    const config = await prisma.integrationConfig.findFirst({
        where: { provider: 'facebook' }
    });
    
    if (!config) return;
    
    const companyId = config.companyId;
    
    const leadEmail = `instagram-mention-${userId}@social.user`;
    await prisma.lead.upsert({
        where: { companyId_email: { companyId, email: leadEmail } },
        update: {},
        create: {
            companyId,
            name: username,
            email: leadEmail,
            source: 'INSTAGRAM',
            status: 'NEW',
            message: `Mentioned in ${mediaType}`,
            tags: ['instagram-mention']
        }
    });
    
    console.log(`[Meta Webhook] Instagram mention logged`);
}
