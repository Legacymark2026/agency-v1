
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding Demo CRM Automation...');

    // 1. Find a company (or create one)
    const company = await prisma.company.findFirst();
    if (!company) {
        console.error('❌ No company found. Please register/seed a company first.');
        return;
    }

    // 2. Define the Demo Workflow
    const demoWorkflow = {
        name: "⚡ Auto-Followup (Deal Won)",
        description: "Automatically creates a task for the account manager when a deal is won.",
        triggerType: "DEAL_STAGE_CHANGED",
        triggerConfig: {
            targetStage: "WON"
        },
        // Visual Graph Steps (Linear for MVP)
        steps: [
            {
                type: "WAIT",
                delay: 3600, // 1 hour
            },
            {
                type: "CREATE_TASK",
                config: {
                    taskTitle: "Send Onboarding Packet to {{dealName}}",
                    taskDescription: "Deal value: ${{value}}. Please prepare the contract and welcome kit.",
                    priority: "HIGH"
                }
            },
            {
                type: "SLACK",
                config: {
                    webhookUrl: "https://hooks.slack.com/services/DEMO/webhook",
                    message: "🎉 New Deal Won! {{dealName}} just closed for ${{value}}."
                }
            }
        ],
        isActive: true,
        companyId: company.id
    };

    // 3. Insert into DB
    const created = await prisma.workflow.create({
        data: demoWorkflow
    });

    console.log(`✅ Created Workflow: ${created.name} (ID: ${created.id})`);

    // 4. Create a Mock Execution to show in Dashboard
    await prisma.workflowExecution.create({
        data: {
            workflowId: created.id,
            status: "SUCCESS",
            startedAt: new Date(Date.now() - 1000 * 60 * 30), // 30 mins ago
            completedAt: new Date(Date.now() - 1000 * 60 * 29),
            logs: [
                { stepIndex: 0, status: "SUCCESS", details: "Wait 1h (Skipped for Demo)" },
                { stepIndex: 1, status: "SUCCESS", details: "Created Task: Send Onboarding Packet" },
                { stepIndex: 2, status: "SUCCESS", details: "Sent Slack Notification" }
            ]
        }
    });

    console.log('✅ Created Mock Execution for Dashboard Widget');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
