import { PrismaClient } from '@prisma/client';
import { triggerWorkflow } from '../../actions/automation';

const prisma = new PrismaClient();

async function runTest() {
    console.log("🚀 Starting Agentic AI Node Execution Test...");

    // 0. Get a company to associate with
    const company = await prisma.company.findFirst();
    if (!company) {
        console.error("❌ No company found in DB. Test cannot proceed.");
        return;
    }

    // 1. Create a Workflow with the new nodes
    const workflow = await prisma.workflow.create({
        data: {
            name: 'Test AI & Code Nodes',
            triggerType: 'WEBHOOK_LISTENER',
            triggerConfig: {},
            companyId: company.id,
            isActive: true,
            steps: [
                { type: 'VOICE_TRANSCRIBER', config: { audioUrlVariable: 'https://example.com/audio.ogg' } },
                { type: 'DATA_EXTRACTOR', config: { textVariable: 'Buy 5 apples', schemaKeys: '{"qty": "number"}' } },
                { type: 'RUN_CODE', config: { code: 'return true;' } }
            ]
        }
    });

    console.log(`✅ Created Workflow ID: ${workflow.id}`);

    // 2. Trigger it
    console.log("⚙️ Triggering workflow...");
    await triggerWorkflow('WEBHOOK_LISTENER', { leadName: "AI Test User" });

    // 3. Wait a moment for async execution
    await new Promise(r => setTimeout(r, 2000));

    // 4. Check results
    const executions = await prisma.workflowExecution.findMany({
        where: { workflowId: workflow.id },
        orderBy: { startedAt: 'desc' },
        take: 1
    });

    console.log(`📊 Found ${executions.length} executions.`);
    if (executions.length > 0) {
        console.log("Last Execution Logs:");
        console.dir(executions[0].logs, { depth: null });
    }

    // Cleanup
    await prisma.workflowExecution.deleteMany({ where: { workflowId: workflow.id } });
    await prisma.workflow.delete({ where: { id: workflow.id } });
    console.log("🧹 Cleanup complete.");
}

runTest().catch(console.error).finally(() => prisma.$disconnect());
