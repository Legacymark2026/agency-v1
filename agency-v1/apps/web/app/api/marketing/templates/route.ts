import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { CampaignTemplate } from '@/components/marketing/campaign-wizard/wizard-store';

export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.companyId) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const companyId = session.user.companyId;

        const record = await prisma.integrationConfig.findUnique({
            where: { companyId_provider: { companyId, provider: 'campaign-templates' } }
        });

        const templates = record?.config ? (record.config as any).templates || [] : [];

        return NextResponse.json({ success: true, data: templates });
    } catch (error) {
        console.error('Error fetching templates:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.companyId) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const companyId = session.user.companyId;
        const body = await req.json();
        
        const newTemplate: CampaignTemplate = body.template;
        if (!newTemplate) {
            return NextResponse.json({ success: false, error: 'Missing template data' }, { status: 400 });
        }

        const record = await prisma.integrationConfig.findUnique({
            where: { companyId_provider: { companyId, provider: 'campaign-templates' } }
        });

        const existingTemplates = record?.config ? (record.config as any).templates || [] : [];
        const updatedTemplates = [...existingTemplates, newTemplate];

        await prisma.integrationConfig.upsert({
            where: { companyId_provider: { companyId, provider: 'campaign-templates' } },
            create: {
                companyId,
                provider: 'campaign-templates',
                config: { templates: updatedTemplates },
            },
            update: {
                config: { templates: updatedTemplates },
            }
        });

        return NextResponse.json({ success: true, data: updatedTemplates });
    } catch (error) {
        console.error('Error saving template:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
