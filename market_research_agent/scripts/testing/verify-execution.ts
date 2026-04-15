
import { PrismaClient } from '@prisma/client';
import { triggerWorkflow } from '../actions/automation';

const prisma = new PrismaClient();

async function main() {
    console.log("🔍 Verifying CRM Automation Engine...");

    // 1. Check if the seed workflow exists
    const workflow = await prisma.workflow.findFirst({
        where: { triggerType: 'DEAL_STAGE_CHANGED' }
    });

    if (!workflow) {
        console.error("❌ No 'DEAL_STAGE_CHANGED' workflow found. Run seed script first.");
        return;
    }
    console.log(`✅ Found Workflow: ${workflow.name} (${workflow.id})`);

    // 2. Simulate Trigger
    console.log("🚀 Triggering 'Deal Won' event...");

    // We can't easily call the Server Action from this script environment due to Next.js context issues.
    // Instead, we will inspect the logic via a direct DB check after manual simulation?
    // No, let's try calling the function. If it relies on 'auth()', it might fail, but triggerWorkflow() does NOT.

    try {
        const result = await triggerWorkflow('DEAL_STAGE_CHANGED', {
            stage: 'WON',
            dealId: 'VERIFY_TEST_DEAL_123',
            dealName: 'Verification Deal',
            value: 9999
        });

        console.log(`✅ Trigger Result:`, result);

        if (result.executed > 0) {
            console.log("Waiting for async execution (1s)...");
            await new Promise(r => setTimeout(r, 1000));

            // 3. Verify Execution Log
            const execution = await prisma.workflowExecution.findFirst({
                where: { workflowId: workflow.id },
                orderBy: { startedAt: 'desc' }
            });

            if (execution) {
                console.log(`✅ Execution Record Found: ${execution.status}`);
                console.log(`Logs:`, execution.logs);
            } else {
                console.error("❌ No execution record found in DB.");
            }
        } else {
            console.warn("⚠️ No workflows executed (Condition mismatch?)");
        }

    } catch (e: any) {
        console.error("❌ Trigger Failed:", e.message);
        console.log("Note: This might be due to Server Action limitations in script.");
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
