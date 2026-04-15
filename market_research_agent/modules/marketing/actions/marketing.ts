"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

import { sendEmail, replaceVariables } from "@/lib/email";
import { generateAIResponse } from "@/lib/ai";
import { sendSlackMessage, makeHttpRequest, sendSMS, sendWhatsApp } from "@/lib/integrations";

export type TriggerData = Record<string, any>;
export type Step = {
    type: "EMAIL" | "WAIT" | "LOG" | "CONDITION" | "AI_AGENT" | "SLACK" | "HTTP" | "SMS" | "WHATSAPP";
    delay?: number;
    templateId?: string;
    config?: Record<string, any>;
};

/**
 * Trigger Logic (Start Execution)
 */
export async function triggerWorkflow(triggerType: string, triggerData: any) {
    // 1. Find active workflows matching trigger
    const workflows = await prisma.workflow.findMany({
        where: {
            isActive: true,
        },
    });

    if (workflows.length === 0) {
        return { executed: 0, message: "No matching workflows found" };
    }

    const results = [];

    // 2. Start executions for each matching workflow
    for (const wf of workflows) {
        // Instead of executing steps directly here, we'll call the new executeWorkflow
        // This allows for better separation of concerns and potential for async execution
        try {
            await executeWorkflow(wf.id, triggerData);
            results.push({ workflowId: wf.id, status: "STARTED" });
        } catch (error) {
            console.error(`Failed to start execution for workflow ${wf.id}:`, error);
            results.push({ workflowId: wf.id, status: "FAILED_TO_START", error: (error as Error).message });
        }
    }

    return { executed: results.length, details: results };
}

export async function executeWorkflow(workflowId: string, triggerData: any) {
    console.log(`Executing workflow ${workflowId}...`, triggerData);

    const execution = await prisma.workflowExecution.create({
        data: {
            workflowId,
            status: 'PENDING',
            logs: [],
            // currentStep: 0  <-- Removed to fix TS error if schema not synced
        }
    });

    try {
        const workflow = await prisma.workflow.findUnique({ where: { id: workflowId } });
        if (!workflow) throw new Error("Workflow not found");

        const steps = workflow.steps as unknown as Step[];
        const logs: any[] = [];
        let skipped = false; // To handle stop scenarios

        for (let i = 0; i < steps.length; i++) {
            if (skipped) break;

            const step = steps[i];
            const logEntry = { stepIndex: i, type: step.type, timestamp: new Date(), status: 'PENDING', details: '' };

            console.log(`Running step ${i}: ${step.type}`);

            // Update DB with progress (Ensure schema is valid)
            await prisma.workflowExecution.update({
                where: { id: execution.id },
                data: { logs: logs as any }
            });

            if (step.type === 'EMAIL') {
                const subject = replaceVariables(step.config?.subject || "Update", triggerData);
                const body = replaceVariables("Hello {{name}}, <br> This is an automated message.", triggerData); // Simple body for now

                if (triggerData.email) {
                    const emailResult = await sendEmail({
                        to: triggerData.email,
                        subject: subject,
                        html: body
                    });

                    if (emailResult.success) {
                        logEntry.status = 'SUCCESS';
                        logEntry.details = `Sent to ${triggerData.email} (ID: ${emailResult.id})`;
                    } else {
                        logEntry.status = 'FAILED';
                        logEntry.details = JSON.stringify(emailResult.error);
                    }
                } else {
                    logEntry.status = 'SKIPPED';
                    logEntry.details = 'No email in trigger data';
                }
            }
            else if (step.type === 'WAIT') {
                const delaySeconds = step.delay || 0;
                console.log(`Waiting ${delaySeconds}s...`);
                // For demo, we still skip long waits, but in prod we'd use a queue
                if (delaySeconds < 10) {
                    await new Promise(r => setTimeout(r, delaySeconds * 1000));
                    logEntry.status = 'SUCCESS';
                } else {
                    logEntry.status = 'QUEUED'; // In a real system, we'd stop here
                    logEntry.details = `Wait ${delaySeconds}s (Simulated)`;
                }
            }
            else if (step.type === 'CONDITION') {
                const { variable, operator, value } = step.config || {};
                const checkValue = triggerData[variable];
                let isMatch = false;

                if (operator === 'contains') isMatch = String(checkValue).includes(value);
                else if (operator === 'equals') isMatch = String(checkValue) === String(value);
                else if (operator === 'starts_with') isMatch = String(checkValue).startsWith(value);

                logEntry.details = `Check ${variable} (${checkValue}) ${operator} ${value} -> ${isMatch}`;
                logEntry.status = isMatch ? 'TRUE' : 'FALSE';

                // MVP Branching: If False, we might want to skip the NEXT step or stop?
                // For this V1, let's say if Condition is False, we STOP execution (Filter logic)
                if (!isMatch) {
                    skipped = true;
                    logEntry.details += " (Stopping Workflow)";
                }
            }
            else if (step.type === 'AI_AGENT') {
                const taskType = step.config?.aiTask || 'SENTIMENT';
                const aiResult = await generateAIResponse(
                    step.config?.promptContext || 'Analyze this',
                    triggerData, // Pass full context (name, email, message, etc.)
                    taskType
                );

                logEntry.details = `AI [${taskType}]: ${JSON.stringify(aiResult.result)}`;
                logEntry.status = 'SUCCESS';

                // Store AI Result in TriggerData for future steps to use!
                if (taskType === 'SENTIMENT') {
                    triggerData['ai_sentiment'] = aiResult.result; // POSITIVE, NEGATIVE, NEUTRAL
                } else if (taskType === 'GENERATION') {
                    triggerData['ai_response'] = aiResult.result; // The generated text
                }
            }
            else if (step.type === 'SLACK') {
                const message = replaceVariables(step.config?.message || '', triggerData);
                const url = step.config?.webhookUrl;
                if (url) {
                    await sendSlackMessage(url, message); // Works for Discord too if URL is Discord
                    logEntry.status = 'SUCCESS';
                    logEntry.details = `Sent to Chat`;
                } else {
                    logEntry.status = 'FAILED';
                    logEntry.details = 'Missing Webhook URL';
                }
            }
            else if (step.type === 'HTTP') {
                const url = replaceVariables(step.config?.url || '', triggerData);
                const method = step.config?.method || 'POST';
                // For now send triggerData as body
                const result = await makeHttpRequest(url, method as any, triggerData);

                logEntry.status = result.success ? 'SUCCESS' : 'FAILED';
                logEntry.details = `${method} ${url} -> ${result.status}`;
            }
            else if (step.type === 'SMS') {
                const to = replaceVariables(step.config?.phoneNumber || '', triggerData);
                const message = replaceVariables(step.config?.message || '', triggerData);
                if (to) {
                    await sendSMS(to, message);
                    logEntry.status = 'SUCCESS';
                    logEntry.details = `SMS to ${to}`;
                } else {
                    logEntry.status = 'FAILED';
                    logEntry.details = 'Missing Phone Number';
                }
            }
            else if (step.type === 'WHATSAPP') {
                const to = replaceVariables(step.config?.phoneNumber || '', triggerData);
                const message = replaceVariables(step.config?.message || '', triggerData);
                if (to) {
                    await sendWhatsApp(to, message);
                    logEntry.status = 'SUCCESS';
                    logEntry.details = `WhatsApp to ${to}`;
                } else {
                    logEntry.status = 'FAILED';
                    logEntry.details = 'Missing Phone Number';
                }
            }
            else if (step.type === 'LOG') {
                console.log("WORKFLOW LOG:", step.config?.message);
                logEntry.status = 'SUCCESS';
            }

            logs.push(logEntry);
        }

        await prisma.workflowExecution.update({
            where: { id: execution.id },
            data: {
                status: skipped ? 'CANCELLED' : 'SUCCESS',
                completedAt: new Date(),
                logs: logs as any
            }
        });

    } catch (error: any) /* eslint-disable-line @typescript-eslint/no-explicit-any */ {
        console.error("Workflow Execution Failed", error);
        await prisma.workflowExecution.update({
            where: { id: execution.id },
            data: {
                status: 'FAILED',
                completedAt: new Date(),
                logs: [{ error: error.message }]
            }
        });
    }
}

/**
 * List workflows for a company
 */
export async function getWorkflows(companyId: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    return await prisma.workflow.findMany({
        where: { companyId },
        orderBy: { createdAt: "desc" },
        include: {
            _count: {
                select: { executions: true }
            }
        }
    });
}

// Helper to save workflow for current user's company
export async function saveUserWorkflow(data: any) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const companyUser = await prisma.companyUser.findFirst({
        where: { userId: session.user.id }
    });

    // If no company, create one for them or fail? 
    // For MVP, fail if no company, or default to a "Personal" company logic if we had it.
    if (!companyUser) {
        // Create a default company for the user if they don't have one?
        // For now, return error.
        return { success: false, error: "No company found for user. Please create a company first." };
    }

    return await saveWorkflow(companyUser.companyId, data);
}
export async function saveWorkflow(companyId: string, data: {
    id?: string;
    name: string;
    description?: string;
    triggerType: string;
    triggerConfig?: any;
    steps: Step[];
    isActive?: boolean;
}) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    // Basic validation
    if (!data.name || !data.steps) {
        return { success: false, error: "Name and Steps are required" };
    }

    try {
        let workflow;
        if (data.id) {
            // Update
            workflow = await prisma.workflow.update({
                where: { id: data.id },
                data: {
                    name: data.name,
                    description: data.description,
                    triggerType: data.triggerType,
                    triggerConfig: data.triggerConfig || {},
                    steps: data.steps,
                    isActive: data.isActive ?? false,
                },
            });
        } else {
            // Create
            workflow = await prisma.workflow.create({
                data: {
                    companyId,
                    name: data.name,
                    description: data.description,
                    triggerType: data.triggerType,
                    triggerConfig: data.triggerConfig || {},
                    steps: data.steps,
                    isActive: data.isActive ?? false,
                },
            });
        }

        return { success: true, workflow };
    } catch (error) {
        console.error("Failed to save workflow:", error);
        return { success: false, error: "Failed to save workflow" };
    }
}

/**
 * Delete a Workflow
 */
export async function deleteWorkflow(id: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    try {
        await prisma.workflow.delete({
            where: { id },
        });
        return { success: true };
    } catch (error) {
        return { success: false, error: "Failed to delete workflow" };
    }
}

/**
 * Toggle Workflow Active Status
 */
export async function toggleWorkflow(id: string, isActive: boolean) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    try {
        await prisma.workflow.update({
            where: { id },
            data: { isActive },
        });
        return { success: true };
    } catch (error) {
        return { success: false, error: "Failed to update status" };
    }
}

/**
 * Get a single workflow
 */
export async function getWorkflow(id: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    return await prisma.workflow.findUnique({
        where: { id },
    });
}
