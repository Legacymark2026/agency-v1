import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createLead } from '@/actions/leads';
import { getIntegrationConfig } from '@/actions/integration-config';

interface GoogleLeadColumn {
    column_name: string;
    string_value?: string;
    column_id?: string;
}

interface GoogleLeadPayload {
    lead_id: string;
    user_column_data: GoogleLeadColumn[];
    api_version: string;
    form_id: number;
    campaign_id: number;
    google_key: string;
    is_test?: boolean;
}

export async function POST(req: NextRequest) {
    try {
        const payload = (await req.json()) as GoogleLeadPayload;
        const companyId = req.nextUrl.searchParams.get('companyId');

        if (!companyId) {
            return NextResponse.json({ error: 'Missing companyId parameter in URL' }, { status: 400 });
        }

        // Verify the Google Key
        const config = await getIntegrationConfig('google-ads');
        const expectedKey = config?.googleWebhookKey;

        if (expectedKey && payload.google_key !== expectedKey) {
            console.error('[Google Lead Webhook] Invalid google_key provided:', payload.google_key);
            return NextResponse.json({ error: 'Invalid google_key' }, { status: 401 });
        }

        if (payload.is_test) {
            console.log('[Google Lead Webhook] Test lead received for company:', companyId);
            return NextResponse.json({ received: true, test: true });
        }

        // Extract Lead fields
        let email = '';
        let fullName = '';
        let phone = '';
        let companyName = '';
        let jobTitle = '';

        payload.user_column_data.forEach(col => {
            const val = col.string_value || '';
            const key = col.column_name.toLowerCase();
            const id = (col.column_id || '').toLowerCase();

            if (key.includes('email') || id.includes('email')) email = val;
            else if (key.includes('name') || id.includes('name')) fullName = val;
            else if (key.includes('phone') || id.includes('phone')) phone = val;
            else if (key.includes('company') || id.includes('company')) companyName = val;
            else if (key.includes('job') || id.includes('job')) jobTitle = val;
        });

        if (!email) {
            // Google sometimes doesn't require email if they only ask for phone, but our CRM requires email.
            // Generate a placeholder if missing
            email = `google-lead-${payload.lead_id}@noemail.com`;
        }

        // Find campaign if campaign_id is provided
        let campaignCode = payload.campaign_id?.toString();

        await createLead({
            companyId,
            email,
            name: fullName,
            phone,
            company: companyName,
            jobTitle: jobTitle,
            campaignCode,
            utmSource: 'google',
            utmMedium: 'cpc',
            utmCampaign: campaignCode,
            formId: `google_lead_form_${payload.form_id}`,
            tags: ['Google Lead Form', 'Ads'],
            formData: payload as any
        });

        return NextResponse.json({ received: true });

    } catch (err: any) {
        console.error('[Google Lead Webhook] Error processing lead:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
