
import { PrismaClient } from '@prisma/client';
import { triggerWorkflow } from '@/actions/automation';

// Mock auth bypass by using direct Prisma for setup
const prisma = new PrismaClient();

async function main() {
    console.log("🚀 Starting End-to-End Automation Verification");

    // 1. Setup: Get Company
    const company = await prisma.company.findFirst();
    if (!company) throw new Error("No company found. Run fix-company-access.ts first.");
    console.log("✅ Company Context:", company.name);

    // 2. Setup: Create Test Workflow (Direct DB to bypass Auth)
    const workflowName = "E2E Test Flow " + Date.now();
    const created = await prisma.workflow.create({
        data: {
            companyId: company.id,
            name: workflowName,
            triggerType: "FORM_SUBMISSION",
            isActive: true,
            triggerConfig: {},
            steps: [
                {
                    type: "LOG",
                    config: { message: "Step 1: Started" }
                },
                {
                    type: "WAIT",
                    delay: 2 // 2 seconds wait
                },
                {
                    type: "EMAIL",
                    templateId: "welcome-test",
                    config: { subject: "Test Email" }
                }
            ]
        }
    });
    console.log(`✅ Created Test Workflow: ${created.id} (${created.name})`);

    // 3. Trigger: Simulate Form Submission
    console.log("\n⚡ Triggering 'FORM_SUBMISSION' event...");
    const triggerResult = await triggerWorkflow("FORM_SUBMISSION", {
        email: "test@example.com",
        name: "Test User"
    });
    console.log(`✅ Trigger Result:`, triggerResult);

    // 4. Verification: Poll for Execution
    console.log("\n👀 Waiting for Execution Engine...");

    // Poll for up to 10 seconds
    let execution = null;
    for (let i = 0; i < 10; i++) {
        await new Promise(r => setTimeout(r, 1000));
        process.stdout.write(".");

        const found = await prisma.workflowExecution.findFirst({
            where: { workflowId: created.id },
            orderBy: { startedAt: 'desc' }
        });

        if (found && found.status === 'SUCCESS') {
            execution = found;
            break;
        }
    }

    console.log("\n");

    if (execution) {
        console.log("🎉 SUCCESS! Workflow executed successfully.");
        console.log("Execution Logs:", JSON.stringify(execution.logs, null, 2));
    } else {
        console.error("❌ FAILED. Execution did not complete in time or wasn't found.");
        const failedExec = await prisma.workflowExecution.findFirst({ where: { workflowId: created.id } });
        if (failedExec) console.log("Current Status:", failedExec.status, failedExec.logs);
    }

    // Cleanup
    await prisma.workflow.delete({ where: { id: created.id } });
    console.log("\n🧹 Cleanup: Test workflow deleted.");
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
