
import { prisma } from "../lib/prisma";
import { executeWorkflow } from "../actions/automation";

async function runOmnichannelDemo() {
    console.log("\n📱 STARTING OMNICHANNEL DEMO (SMS + WHATSAPP) 📱");

    // 1. Create a Workflow with Mobile Capabilities
    console.log("\n1️⃣ Creating Mobile-First Workflow...");
    const workflow = await prisma.workflow.create({
        data: {
            name: "VIP Mobile Alert System",
            description: "Sends SMS and WhatsApp notifications to VIPs",
            companyId: "demo-company",
            triggerType: "WEBHOOK",
            triggerConfig: {},
            isActive: true,
            steps: [
                {
                    type: "LOG",
                    config: { message: "🚀 Starting Mobile Sequence for {{name}}" }
                },
                {
                    type: "SMS", // Step 1: Send SMS
                    config: {
                        phoneNumber: "+15550001234",
                        message: "Hi {{name}}, your VIP package has shipped! 📦"
                    }
                },
                {
                    type: "WAIT",
                    delay: 2 // Wait 2 seconds
                },
                {
                    type: "WHATSAPP", // Step 2: Send WhatsApp
                    config: {
                        phoneNumber: "+15550001234",
                        message: "Here is your tracking link: https://track.com/{{id}} 🚚"
                    }
                }
            ] as any
        }
    });
    console.log(`✅ Workflow Created: ${workflow.id}`);

    // 2. Trigger Workflow
    console.log("\n2️⃣ Triggering Workflow...");
    const triggerData = {
        name: "Elon Musk",
        id: "TRACK-999"
    };

    await executeWorkflow(workflow.id, triggerData);

    // 3. Verify Logs
    console.log("\n3️⃣ Verifying Mobile Logs...");
    const execution = await prisma.workflowExecution.findFirst({
        where: { workflowId: workflow.id },
        orderBy: { startedAt: 'desc' }
    });

    if (execution) {
        console.log("📜 Execution Logs:");
        (execution.logs as any[]).forEach(log => {
            let statusIcon = "✅";
            if (log.status === "FAILED") statusIcon = "❌";

            console.log(`${statusIcon} [${log.type}] ${log.details}`);
        });

        const success = execution.status === 'SUCCESS';
        console.log(`\n🎉 Final Status: ${success ? 'PASSED' : 'FAILED'}`);
    } else {
        console.error("❌ No execution found!");
    }

    // Cleanup
    await prisma.workflow.delete({ where: { id: workflow.id } });
}

runOmnichannelDemo().catch(console.error);
