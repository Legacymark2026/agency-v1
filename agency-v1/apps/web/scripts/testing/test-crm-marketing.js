const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🧪 Starting CRM Marketing Verification...');

    // 1. Setup Company
    const companySlug = 'marketing-test-' + Date.now();
    const company = await prisma.company.create({
        data: {
            name: 'Marketing Test Corp',
            slug: companySlug,
        }
    });
    console.log(`✅ Organization Created: ${company.name}`);

    try {
        // 2. Create Workflow
        console.log('\nTesting Workflow Creation...');
        const workflow = await prisma.workflow.create({
            data: {
                name: 'Welcome Email Series',
                companyId: company.id,
                triggerType: 'FORM_SUBMISSION',
                triggerConfig: { formId: 'newsletter-signup' },
                steps: [
                    { type: 'EMAIL', templateId: 'welcome-1', delay: 0 },
                    { type: 'WAIT', duration: 86400 }, // 24h
                    { type: 'EMAIL', templateId: 'welcome-2', delay: 0 }
                ],
                isActive: true
            }
        });

        if (workflow.id && workflow.steps.length === 3) {
            console.log(`✅ Workflow Created: ${workflow.name} (ID: ${workflow.id})`);
        } else {
            throw new Error('Workflow creation failed integrity check');
        }

        // 3. Simulate Execution
        console.log('\nTesting Workflow Execution...');
        const execution = await prisma.workflowExecution.create({
            data: {
                workflowId: workflow.id,
                status: 'PENDING',
                logs: { started: true, triggerData: { email: 'test@example.com' } }
            }
        });

        if (execution.status === 'PENDING') {
            console.log(`✅ Execution Started: ID ${execution.id}`);
        }

        // 4. Update Execution
        const updated = await prisma.workflowExecution.update({
            where: { id: execution.id },
            data: {
                status: 'SUCCESS',
                completedAt: new Date(),
                logs: {
                    started: true,
                    stepsCompleted: 3,
                    result: 'All emails sent'
                }
            }
        });
        console.log(`✅ Execution Completed: Status ${updated.status}`);

    } catch (error) {
        console.error('❌ Verification Failed:', error);
        process.exit(1);
    } finally {
        // Cleanup
        await prisma.company.delete({ where: { id: company.id } });
        console.log('\n🧹 Cleanup successful');
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
