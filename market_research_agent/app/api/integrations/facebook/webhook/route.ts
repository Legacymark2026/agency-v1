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
 */

// Meta Verification Handler (GET)
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    console.log(`[Meta Webhook] Validation Attempt - Mode: ${mode}, Token: ${token}`);

    const VERIFY_TOKEN = process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN || 'legacymark_meta_sync';

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
                for (const change of entry.changes) {
                    if (change.field === 'leadgen') {
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

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[Meta Webhook] Handler error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
