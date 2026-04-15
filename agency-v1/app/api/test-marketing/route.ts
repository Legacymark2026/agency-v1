import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { triggerWorkflow } from '@/actions/automation';

export async function GET() {
    try {
        // 1. Setup Test Data
        const company = await prisma.company.findFirst();
        if (!company) return NextResponse.json({ error: 'No company found' }, { status: 404 });

        // Ensure a workflow exists
        const wfName = 'API Test Workflow ' + Date.now();
        await prisma.workflow.create({
            data: {
                name: wfName,
                companyId: company.id,
                triggerType: 'TEST_TRIGGER',
                triggerConfig: { foo: 'bar' },
                steps: [
                    { type: 'LOG', message: 'Step 1 executed' },
                    { type: 'EMAIL', templateId: 'api-test-email' }
                ],
                isActive: true
            }
        });

        // 2. Trigger It
        const result = await triggerWorkflow('TEST_TRIGGER', { source: 'api', companyId: company.id });

        return NextResponse.json({
            success: true,
            result,
            companyId: company.id
        });

    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}
