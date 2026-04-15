
import { prisma } from "../lib/prisma";
import { executeWorkflow } from "../actions/automation";

async function runDemo() {
    console.log("\n🚀 STARTING FULL SYSTEM DEMO (AI + CONNECTIVITY) 🚀");

    // 0. Ensure Demo Company Exists
    console.log("\n0️⃣  Ensuring Demo Company Exists...");
    await prisma.company.upsert({
        where: { id: "demo-company" },
        update: {},
        create: {
            id: "demo-company",
            name: "Demo Company",
            slug: "demo-company",
            subscriptionTier: "pro",
            subscriptionStatus: "active"
        }
    });

    // 1. Create a Workflow with ALL Capabilities
    console.log("\n1️⃣ Creating Smart Workflow...");
    const workflow = await prisma.workflow.create({
        data: {
            name: "AI Lead Handling System",
            description: "Analyzes lead sentiment and routes accordingly",
            companyId: "demo-company",
            triggerType: "WEBHOOK",
            triggerConfig: {},
            isActive: true,
            steps: [
                {
                    type: "LOG",
                    config: { message: "⚡ New Lead Received via Webhook!" }
                },
                {
                    type: "AI_AGENT", // Step 1: Analyze Sentiment
                    config: {
                        aiTask: "SENTIMENT",
                        promptContext: "Analyze the tone of this message: {{message}}"
                    }
                },
                {
                    type: "LOG",
                    config: { message: "🧠 AI Analysis Complete. Sentiment: {{ai_sentiment}}" }
                },
                {
                    type: "CONDITION", // Step 2: Branch Logic
                    config: {
                        variable: "ai_sentiment",
                        operator: "equals",
                        value: "NEGATIVE"
                    }
                },
                // If Negative (Condition True):
                {
                    type: "SLACK", // Step 3: Alert Team
                    config: {
                        webhookUrl: "https://hooks.slack.com/services/MOCK/DEMO/123",
                        message: "🚨 URGENT: Angry Customer detected! Email: {{email}}"
                    }
                },
                {
                    type: "AI_AGENT", // Step 4: Draft Apology
                    config: {
                        aiTask: "GENERATION",
                        promptContext: "Write a very apologetic email to {{name}} about their issue: {{message}}"
                    }
                },
                {
                    type: "EMAIL", // Step 5: Send AI Draft
                    config: {
                        subject: "We are so sorry (AI Drafted)",
                        // In reality, we'd use the {{ai_response}} variable in the body, 
                        // but the current email engine has a simple body replacer. 
                        // Let's assume the body logic uses the context.
                    }
                }
            ] as any
        }
    });
    console.log(`✅ Workflow Created: ${workflow.id}`);
    console.log(`🔗 Webhook URL: /api/webhooks/${workflow.id}`);

    // 2. Simulate Webhook Trigger (Negative Sentiment)
    console.log("\n2️⃣ Simulating Webhook Trigger (Angry Customer)...");
    const triggerData = {
        name: "Karen Smith",
        email: "karen@example.com",
        message: "This service is terrible! I want a refund immediately!",
        source: "Landing Page"
    };

    // Execute!
    await executeWorkflow(workflow.id, triggerData);

    // 3. Check Logs
    console.log("\n3️⃣ Verifying Execution Logs...");
    const execution = await prisma.workflowExecution.findFirst({
        where: { workflowId: workflow.id },
        orderBy: { startedAt: 'desc' }
    });

    if (execution) {
        console.log("📜 Execution Logs:");
        (execution.logs as any[]).forEach(log => {
            let statusIcon = "✅";
            if (log.status === "FAILED") statusIcon = "❌";
            if (log.status === "SKIPPED") statusIcon = "⏭️";
            if (log.status === "TRUE") statusIcon = "👍";

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

runDemo().catch(console.error);
