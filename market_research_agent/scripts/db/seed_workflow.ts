
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding test workflow...');

    // Find a company (mocking the auth context by just picking the first one or creating one)
    // Since we are running as a script, we bypass auth() checks in the action, 
    // but we need a companyId to satisfy foreign key.

    let company = await prisma.company.findFirst();
    if (!company) {
        console.log('No company found, creating generic test company...');
        company = await prisma.company.create({
            data: {
                name: 'Test Company',
                slug: 'test-company-' + Date.now(),
            }
        });
    }

    const workflow = await prisma.workflow.create({
        data: {
            companyId: company.id,
            name: 'API Trigger Test Flow',
            description: 'Created by verification script',
            triggerConfig: {},
            triggerType: 'WEBHOOK',
            isActive: true,
            steps: [
                {
                    type: 'LOG',
                    config: { message: 'Workflow triggered successfully via API!' }
                },
                {
                    type: 'CONDITION',
                    config: {
                        variable: 'email',
                        operator: 'contains',
                        value: '@'
                    }
                },
                {
                    type: 'LOG',
                    config: { message: 'Email validation passed.' }
                }
            ] as any
        },
    });

    console.log(`Created Workflow: ${workflow.id} (Trigger: FORM_SUBMISSION)`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
