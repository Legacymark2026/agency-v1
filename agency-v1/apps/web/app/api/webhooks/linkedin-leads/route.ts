import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createLead } from '@/actions/leads';
import { getIntegrationConfig } from '@/actions/integration-config';
import crypto from 'node:crypto';

export async function POST(req: NextRequest) {
    try {
        const payload = await req.json();
        const companyId = req.nextUrl.searchParams.get('companyId');

        if (!companyId) {
            return NextResponse.json({ error: 'Missing companyId parameter in URL' }, { status: 400 });
        }

        // Verify the Webhook Key (passed in headers or query params)
        // FIX: 'linkedin-insight' maps to 'linkedin-ads' in new provider family; cast to fix TS2345
        const config = (await getIntegrationConfig('linkedin-ads' as any)) as any;
        const expectedKey = config?.linkedinWebhookKey || config?.linkedinClientSecret;
        
        // Authorization could be in the header "Authorization: Bearer <key>" or as a query param
        const authHeader = req.headers.get('authorization')?.replace('Bearer ', '');
        const queryKey = req.nextUrl.searchParams.get('key');
        
        const isAuthHeaderValid = authHeader && expectedKey &&
            Buffer.byteLength(authHeader) === Buffer.byteLength(expectedKey) &&
            crypto.timingSafeEqual(Buffer.from(authHeader), Buffer.from(expectedKey));

        const isQueryKeyValid = queryKey && expectedKey &&
            Buffer.byteLength(queryKey) === Buffer.byteLength(expectedKey) &&
            crypto.timingSafeEqual(Buffer.from(queryKey), Buffer.from(expectedKey));

        if (expectedKey && !isAuthHeaderValid && !isQueryKeyValid) {
            console.error('[LinkedIn Lead Webhook] Invalid webhook secret provided');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // LinkedIn payloads can vary based on whether it's coming from Zapier, Make, or natively.
        // We'll perform a generic extraction for common Lead Generation fields.
        let email = '';
        let fullName = '';
        let phone = '';
        let companyName = '';
        let jobTitle = '';
        
        // Flatten payload recursively to find values
        const searchForKeys = (obj: any) => {
            if (!obj || typeof obj !== 'object') return;
            
            for (const [key, val] of Object.entries(obj)) {
                if (val && typeof val === 'object') {
                    searchForKeys(val);
                } else if (typeof val === 'string') {
                    const lKey = key.toLowerCase();
                    if (lKey.includes('email') || lKey === 'urn:li:emailAddress') email = val;
                    else if (lKey.includes('phone') || lKey.includes('mobile')) phone = val;
                    else if (lKey.includes('company') || lKey === 'urn:li:companyName') companyName = val;
                    else if (lKey.includes('title') || lKey === 'urn:li:title') jobTitle = val;
                    else if (lKey === 'first name' || lKey === 'urn:li:firstName') fullName = fullName ? `${val} ${fullName}` : val;
                    else if (lKey === 'last name' || lKey === 'urn:li:lastName') fullName = fullName ? `${fullName} ${val}` : val;
                    else if (lKey === 'name') fullName = val;
                }
            }
        };

        searchForKeys(payload);

        if (!email) {
            // Give a placeholder email if absolutely missing, but mostly B2B leads have emails.
            email = `linkedin-lead-${Date.now()}@noemail.com`;
        }

        const campaignId = payload?.campaignId || payload?.campaign_id || null;
        const formId = payload?.formId || payload?.form_id || 'linkedin_form';

        await createLead({
            companyId,
            email,
            name: fullName.trim(),
            phone,
            company: companyName,
            jobTitle: jobTitle,
            campaignCode: campaignId?.toString(),
            utmSource: 'linkedin',
            utmMedium: 'cpm', // LinkedIn is often CPM/Sponsored Content
            utmCampaign: campaignId?.toString(),
            formId: `linkedin_lead_form_${formId}`,
            tags: ['LinkedIn Lead Form', 'B2B Ads'],
            formData: payload as any
        });

        return NextResponse.json({ received: true });

    } catch (err: any) {
        console.error('[LinkedIn Lead Webhook] Error processing lead:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
