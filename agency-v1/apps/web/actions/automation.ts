"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import Handlebars from "handlebars";

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/** Defers a workflow resumption via Upstash QStash (no blocking) */
async function scheduleWaitResume(executionId: string, fromNodeId: string, delayMs: number) {
    const qstashUrl = process.env.QSTASH_URL;
    const qstashToken = process.env.QSTASH_TOKEN;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://legacymarksas.com";

    if (!qstashUrl || !qstashToken) {
        // Dev fallback — synchronous fast-forward for short waits only
        if (delayMs < 10_000) await new Promise(r => setTimeout(r, delayMs));
        return;
    }

    const delaySeconds = Math.ceil(delayMs / 1000);
    await fetch(`${qstashUrl}/v2/publish/${appUrl}/api/automation/resume`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${qstashToken}`,
            "Content-Type": "application/json",
            [`Upstash-Delay`]: `${delaySeconds}s`,
        },
        body: JSON.stringify({ executionId, fromNodeId }),
    });
}

/** Executes a real action node against live services */
async function executeRealAction(
    actionType: string,
    config: Record<string, any>,
    context: Record<string, any>,
    companyId: string
): Promise<string> {
    switch (actionType) {
        case "SEND_EMAIL": {
            const to = context[config.toVariable || "email"] || config.to;
            if (!to) return "SKIPPED: no recipient email in context";

            let html = config.htmlBody || config.body || "<p>Email automático</p>";
            let subject = config.subject || "Mensaje de LegacyMark";

            // Render Handlebars if template detected
            if (html.includes("{{")) {
                try {
                    html = Handlebars.compile(html)(context);
                    subject = Handlebars.compile(subject)(context);
                } catch { /* use raw if template fails */ }
            }

            const result = await sendEmail({ to, subject, html, companyId });
            return result.success ? `EMAIL_SENT to ${to}` : `EMAIL_FAILED: ${result.error}`;
        }

        case "UPDATE_DEAL": {
            const dealId = context.__dealId || config.dealId;
            if (!dealId) return "SKIPPED: no dealId in context";
            await prisma.deal.update({
                where: { id: dealId },
                data: {
                    ...(config.stage ? { stage: config.stage } : {}),
                    ...(config.priority ? { priority: config.priority } : {}),
                    lastActivity: new Date(),
                },
            });
            return `DEAL_UPDATED: ${dealId}`;
        }

        case "CREATE_TASK": {
            const assignedTo = context.__assignedTo || config.assignedTo;
            if (!assignedTo) return "SKIPPED: no assignedTo";
            await prisma.task.create({
                data: {
                    title: Handlebars.compile(config.title || "Tarea automática")(context),
                    description: config.description || null,
                    priority: config.priority || "MEDIUM",
                    assignedTo: assignedTo,
                    createdBy: assignedTo, // system-generated task; use assignee as creator
                    companyId,
                },
            });
            return `TASK_CREATED`;
        }

        case "ADD_TAG": {
            const dealId = context.__dealId || config.dealId;
            if (!dealId || !config.tag) return "SKIPPED";
            const deal = await prisma.deal.findUnique({ where: { id: dealId }, select: { tags: true } });
            const tags: string[] = (deal?.tags as string[]) ?? [];
            if (!tags.includes(config.tag)) {
                await prisma.deal.update({ where: { id: dealId }, data: { tags: [...tags, config.tag] } });
            }
            return `TAG_ADDED: ${config.tag}`;
        }

        case "SEND_NOTIFICATION": {
            const userId = context.__assignedTo || config.userId;
            if (!userId) return "SKIPPED: no userId";
            await prisma.notification.create({
                data: {
                    userId,
                    companyId,
                    title: Handlebars.compile(config.title || "Notificación automática")(context),
                    message: Handlebars.compile(config.message || "")(context),
                    type: "AUTOMATION",
                },
            });
            return `NOTIFICATION_SENT to ${userId}`;
        }

        case "HTTP": {
            if (!config.url) return "SKIPPED: no url";
            const res = await fetch(config.url, {
                method: config.method || "POST",
                headers: { "Content-Type": "application/json", ...(config.headers || {}) },
                body: JSON.stringify({ ...context, ...config.body }),
                signal: AbortSignal.timeout(10_000),
            });
            return `HTTP_${res.status}: ${config.url}`;
        }

        case "SEND_WHATSAPP": {
            const phone = context[config.phoneVariable || "phone"] || config.phone;
            if (!phone) return "SKIPPED: no phone";
            try {
                // Dynamic import — WhatsApp service may not be available in all envs
                const waService = await import("@/lib/whatsapp-service");
                const sendFn = (waService as any).sendWhatsAppMessage || (waService as any).sendMessage;
                if (!sendFn) return "SKIPPED: whatsapp send function not found";
                const message = Handlebars.compile(config.message || "Hola")(context);
                await sendFn(phone, message);
                return `WHATSAPP_SENT to ${phone}`;
            } catch (e: any) {
                return `WHATSAPP_ERROR: ${e.message}`;
            }
        }

        case "AI_AGENT": {
            if (!config.agentId) return "SKIPPED: no agentId";
            const { runAIAgent } = await import("@/lib/agent-runner");
            // Acepta `prompt`, `promptContext` (del seed) o usa el contexto completo
            const userPrompt = config.prompt || config.promptContext || "Analiza este contexto";
            const messageTemplate = config.messageTemplate
                ? Handlebars.compile(config.messageTemplate)(context)
                : JSON.stringify(context);
            const result = await runAIAgent({
                agentId: config.agentId,
                companyId,
                userMessage: `${userPrompt}\n\nContexto: ${messageTemplate}`,
                contactData: context,
            });
            // Inject AI response into context for downstream nodes
            context.__aiResponse = result.result;
            context.ai_response = result.result; // compatibility with executor format
            return `AI_AGENT_RAN: ${result.agentName} (${result.tokensUsed ?? "?"} tokens)`;
        }

        case "DB_WRITE": {
            // ── LLM GATEKEEPER: valida la operación antes de ejecutar ────────
            const allowedModels = ["lead", "conversation", "deal", "task", "message", "notification"];
            const model = (config.model || "").toLowerCase();
            const operation = config.operation || "";

            if (!allowedModels.includes(model)) {
                return `DB_WRITE_BLOCKED: Model '${model}' no está en la lista permitida (${allowedModels.join(", ")})`;
            }
            if ((operation === "delete" || operation === "update") && !config.where) {
                return `DB_WRITE_BLOCKED: ${operation.toUpperCase()} sin cláusula WHERE está prohibido por el Gatekeeper`;
            }

            // Ejecutar escritura segura
            try {
                const client = (prisma as any)[model];
                if (!client) return `DB_WRITE_BLOCKED: Prisma model '${model}' no existe`;

                let result: any;
                const data = { ...(config.data || {}), companyId };
                // ── FIX #3: Siempre incluir companyId en where para operaciones de mutación
                // Esto previene acceso cross-tenant (un workflow de empresa A no puede
                // modificar registros de empresa B aunque el agente lo intente)
                const where = { ...(config.where || {}), companyId };

                if (operation === "create") result = await client.create({ data });
                else if (operation === "update") result = await client.update({ where, data: config.data });
                else if (operation === "upsert") result = await client.upsert({ where, create: data, update: config.data });
                else if (operation === "delete") result = await client.delete({ where });
                else return `DB_WRITE_ERROR: Operación '${operation}' desconocida`;

                return `DB_WRITE_SUCCESS: ${operation} on ${model} (id: ${(result as any)?.id ?? 'N/A'})`;
            } catch (e: any) {
                return `DB_WRITE_ERROR: ${e.message}`;
            }
        }

        default:
            return `UNKNOWN_ACTION: ${actionType}`;
    }
}

export async function getRecentExecutions(companyId: string) {
    try {
        const executions = await prisma.workflowExecution.findMany({
            where: { workflow: { companyId } },
            take: 10,
            orderBy: { startedAt: 'desc' },
            include: {
                workflow: {
                    select: { name: true, id: true }
                }
            }
        });
        return executions;
    } catch (e) {
        console.error(e);
        return [];
    }
}

export async function getExecutionById(executionId: string) {
    try {
        const execution = await prisma.workflowExecution.findUnique({
            where: { id: executionId },
            include: {
                workflow: true
            }
        });
        return execution;
    } catch (e) {
        console.error(e);
        return null;
    }
}

export async function getAutomationAnalytics(companyId: string) {
    try {
        const [totalWorkflows, activeWorkflows, totalExecutions, failedExecutions] = await Promise.all([
            prisma.workflow.count({ where: { companyId } }),
            prisma.workflow.count({ where: { companyId, isActive: true } }),
            prisma.workflowExecution.count({ where: { workflow: { companyId } } }),
            prisma.workflowExecution.count({ where: { workflow: { companyId }, status: 'FAILED' } })
        ]);

        const successRate = totalExecutions > 0
            ? Math.round(((totalExecutions - failedExecutions) / totalExecutions) * 100)
            : 0;

        // Get executions for the last 30 days for the sparkline
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentActivity = await prisma.workflowExecution.groupBy({
            by: ['status'],
            where: {
                workflow: { companyId },
                startedAt: { gte: thirtyDaysAgo }
            },
            _count: true
        });

        // Top workflows
        const topWorkflows = await prisma.workflow.findMany({
            where: { companyId },
            include: {
                _count: {
                    select: { executions: true }
                }
            },
            orderBy: {
                executions: { _count: 'desc' }
            },
            take: 5
        });

        return {
            totalWorkflows,
            activeWorkflows,
            totalExecutions,
            successRate,
            recentActivity,
            topWorkflows
        };
    } catch (e) {
        console.error("Failed to get automation analytics", e);
        return null;
    }
}

// --- TYPES ---
export type TriggerData = Record<string, any>;
export type StepType =
    "SLACK" | "HTTP" | "SMS" | "WHATSAPP" |
    "CREATE_TASK" | "UPDATE_DEAL" | "SEND_NOTIFICATION" |
    "SWITCH" | "LOOP" | "ADD_TAG" | "REMOVE_TAG" | "ASSIGN_USER" |
    "VOICE_TRANSCRIBER" | "KNOWLEDGE_RAG" | "DATA_EXTRACTOR" | "RUN_CODE" | "FIND_RECORD" | "CALENDAR_EVENT" | "AI_AGENT" |
    "EMAIL" | "WAIT" | "LOG" | "CONDITION" | "DB_WRITE" | "SEND_EMAIL" | "SEND_WHATSAPP";

export type Step = {
    type: StepType;
    delay?: number;
    templateId?: string;
    config?: Record<string, any>;
};

// --- CORE ENGINE ---

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function triggerWorkflow(triggerType: string, triggerData: any) {
    const workflows = await prisma.workflow.findMany({
        where: { isActive: true, triggerType: triggerType },
    });

    if (workflows.length === 0) return { executed: 0 };

    const results = [];
    for (const wf of workflows) {
        const config = (wf.triggerConfig ?? {}) as any;

        // ── DEAL_STAGE_CHANGED: filtrar por etapa exacta ──────────────────────
        if (triggerType === 'DEAL_STAGE_CHANGED') {
            // Seeds usan `stage`, builder visual usa `targetStage` → aceptar ambos
            const requiredStage = config.stage || config.targetStage;
            if (requiredStage && requiredStage !== triggerData.stage) continue;
        }

        // ── FORM_SUBMISSION: filtrar por fuente de formulario ─────────────────
        if (triggerType === 'FORM_SUBMISSION') {
            if (config.formSource && config.formSource !== triggerData.source) continue;
        }

        // ── WHATSAPP_TRIGGER / INSTAGRAM_TRIGGER: filtrar por canal si aplica ─
        if (triggerType === 'WHATSAPP_TRIGGER' || triggerType === 'INSTAGRAM_TRIGGER') {
            if (config.channel && config.channel !== 'all' && config.channel !== triggerData.channel) continue;
        }

        try {
            // Async execution in background (fire and forget for caller)
            executeWorkflow(wf.id, triggerData).catch(err => console.error("Async Workflow Error", err));
            results.push({ workflowId: wf.id, status: "STARTED" });
        } catch (error) {
            console.error(`Failed to start workflow ${wf.id}`, error);
        }
    }
    return { executed: results.length, details: results };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function executeWorkflow(workflowId: string, triggerData: any, resumeFromNodeId?: string) {
    console.log(`[DAG Engine] Executing ${workflowId}`, resumeFromNodeId ? `resuming from ${resumeFromNodeId}` : 'fresh start');

    const workflow = await prisma.workflow.findUnique({ where: { id: workflowId } });
    if (!workflow) throw new Error("Workflow not found");

    // ── FIX #1: Resume — reusar el execution existente en WAITING en vez de crear uno nuevo ──
    let execution: { id: string };
    if (resumeFromNodeId) {
        // Buscar el execution existente en estado WAITING para este workflow
        const existingExecution = await prisma.workflowExecution.findFirst({
            where: { workflowId, status: 'WAITING' },
            orderBy: { startedAt: 'desc' }
        });
        if (existingExecution) {
            // Reusar el existente — actualizar a RUNNING
            execution = await prisma.workflowExecution.update({
                where: { id: existingExecution.id },
                data: { status: 'RUNNING' }
            });
            console.log(`[DAG Engine] Resuming existing execution ${execution.id} from node ${resumeFromNodeId}`);
        } else {
            // No hay execution en WAITING — crear uno nuevo (edge case)
            execution = await prisma.workflowExecution.create({
                data: { workflowId, status: 'RUNNING', logs: [] }
            });
        }
    } else {
        // Ejecución fresca — crear siempre un nuevo execution
        execution = await prisma.workflowExecution.create({
            data: { workflowId, status: 'RUNNING', logs: [] }
        });
    }

    try {
        const stepsData = workflow.steps as any;
        const logs: any[] = [];

        // ── LEGACY ARRAY EXECUTOR ──────────────────────────────────────────────
        if (Array.isArray(stepsData)) {
            for (let i = 0; i < stepsData.length; i++) {
                const step = stepsData[i];
                const logEntry = { stepIndex: i, type: step.type, timestamp: new Date(), status: 'PENDING', details: '' };
                try {
                    const details = await executeRealAction(step.type, step.config || step, triggerData, workflow.companyId);
                    logEntry.status = 'SUCCESS';
                    logEntry.details = details;
                } catch (err: any) {
                    logEntry.status = 'ERROR';
                    logEntry.details = err.message;
                }
                logs.push(logEntry);
            }
        }
        // ── NATIVE DAG MULTI-BRANCH EXECUTOR ──────────────────────────────────
        else if (stepsData?.nodes && stepsData?.edges) {
            const nodes: any[] = stepsData.nodes;
            const edges: any[] = stepsData.edges;
            const nodesMap = new Map<string, any>(nodes.map(n => [n.id, n]));

            // Shared mutable context — all nodes read & write here
            const context: Record<string, any> = { ...triggerData };

            const visitedNodes = new Set<string>(); // cycle guard

            const traverseNode = async (nodeId: string, depth = 0): Promise<void> => {
                if (depth > 50) throw new Error("Max recursion depth exceeded.");
                if (visitedNodes.has(nodeId)) return; // already processed (shared branch)
                visitedNodes.add(nodeId);

                const node = nodesMap.get(nodeId);
                if (!node) return;

                // Skip nodes before the resume checkpoint
                if (resumeFromNodeId && nodeId !== resumeFromNodeId && !visitedNodes.has(resumeFromNodeId)) return;

                const logEntry: any = {
                    nodeId: node.id, type: node.type,
                    timestamp: new Date().toISOString(),
                    status: 'RUNNING', details: ''
                };
                let conditionResult: boolean | null = null;

                try {
                    // ── triggerNode: just pass through ─────────────────────────
                    if (node.type === 'triggerNode') {
                        logEntry.details = `Trigger: ${node.data?.label || node.data?.triggerType || 'START'}`;
                    }
                    // ── actionNode + crmActionNode ─────────────────────────────
                    else if (node.type === 'actionNode' || node.type === 'crmActionNode') {
                        const actionType = node.data?.actionType || node.data?.type || 'SEND_EMAIL';
                        logEntry.details = await executeRealAction(actionType, node.data || {}, context, workflow.companyId);
                    }
                    // ── conditionNode ──────────────────────────────────────────
                    else if (node.type === 'conditionNode') {
                        const variable = node.data?.variable || 'email';
                        const operator = node.data?.operator || 'contains';
                        const targetVal = String(node.data?.conditionValue || node.data?.value || '');
                        const actualVal = String(context[variable] || '');

                        switch (operator) {
                            case 'equals':     conditionResult = actualVal.toLowerCase() === targetVal.toLowerCase(); break;
                            case 'not_equals': conditionResult = actualVal.toLowerCase() !== targetVal.toLowerCase(); break;
                            case 'gt':         conditionResult = parseFloat(actualVal) > parseFloat(targetVal); break;
                            case 'lt':         conditionResult = parseFloat(actualVal) < parseFloat(targetVal); break;
                            case 'contains':   conditionResult = actualVal.toLowerCase().includes(targetVal.toLowerCase()); break;
                            default:           conditionResult = actualVal.toLowerCase().includes(targetVal.toLowerCase());
                        }
                        logEntry.details = `IF ${variable} ${operator} '${targetVal}' → ${conditionResult ? 'TRUE ✓' : 'FALSE ✗'}`;
                    }
                    // ── waitNode — defer via QStash for long delays ─────────────
                    else if (node.type === 'waitNode') {
                        let ms = parseInt(node.data?.delayValue || '1') * 1000;
                        if (node.data?.delayUnit === 'm') ms *= 60;
                        if (node.data?.delayUnit === 'h') ms *= 3600;
                        if (node.data?.delayUnit === 'd') ms *= 86400;

                        if (ms < 15_000) {
                            // Short waits (< 15s): synchronous — safe for serverless
                            await new Promise(r => setTimeout(r, ms));
                            logEntry.details = `Waited ${ms}ms synchronously`;
                        } else {
                            // Long waits: checkpoint + QStash deferred resume
                            await prisma.workflowExecution.update({
                                where: { id: execution.id },
                                data: {
                                    status: 'WAITING',
                                    resumeAt: new Date(Date.now() + ms),
                                    logs: [...logs, { ...logEntry, status: 'WAITING', details: `Scheduled resume in ${ms}ms` }] as any,
                                },
                            });

                            // Schedule QStash to resume after delay
                            const outEdges = edges.filter(e => e.source === nodeId);
                            for (const edge of outEdges) {
                                await scheduleWaitResume(execution.id, edge.target, ms);
                            }

                            logEntry.details = `WAIT deferred ${ms}ms — QStash scheduled`;
                            logs.push({ ...logEntry, status: 'WAITING' });
                            return; // stop current traversal here; QStash will resume
                        }
                    }
                    // ── switchNode — N-way branching with value/contains matching ──
                    else if (node.type === 'switchNode') {
                        const variable = node.data?.variable || 'status';
                        const actualVal = String(context[variable] || '');
                        const branches: any[] = node.data?.branches || [];

                        // Find matching branch: try strict equality first, then contains
                        const matchedBranch = branches.find((b: any) => {
                            const bVal = String(b.value || '');
                            const matchMode = b.matchMode || 'equals';
                            if (matchMode === 'contains') return actualVal.toLowerCase().includes(bVal.toLowerCase());
                            if (matchMode === 'startsWith') return actualVal.toLowerCase().startsWith(bVal.toLowerCase());
                            return actualVal.toLowerCase() === bVal.toLowerCase(); // default: equals
                        });

                        // Store branch id in logEntry for edge routing
                        (logEntry as any).__switchBranch = matchedBranch?.id || 'default';
                        logEntry.details = `SWITCH "${variable}" (="${actualVal}") → Branch: "${matchedBranch?.label || 'default (no match)'}"` ;

                        logs.push({ ...logEntry, status: 'SUCCESS' });

                        // Route only to the matched branch's edge
                        const outEdges = edges.filter(e => e.source === nodeId);
                        const matchEdge = matchedBranch
                            ? outEdges.find(e => e.sourceHandle === matchedBranch.id)
                            : outEdges.find(e => e.sourceHandle === 'default') || outEdges[0];

                        if (matchEdge) await traverseNode(matchEdge.target, depth + 1);
                        return; // routing handled here
                    }
                    // ── loopNode — isolated context per iteration ──────────────
                    else if (node.type === 'loopNode') {
                        const iterVar = node.data?.iterableVariable || 'items';
                        const rawArr = context[iterVar];
                        const arr: any[] = Array.isArray(rawArr) ? rawArr : [];

                        logEntry.details = `LOOP "${iterVar}" — ${arr.length} items`;
                        logs.push({ ...logEntry, status: 'SUCCESS' });

                        const outEdges = edges.filter(e => e.source === nodeId);
                        const nextItemEdge = outEdges.find(e => e.sourceHandle === 'loop' || e.sourceHandle === 'next');
                        const doneEdge = outEdges.find(e => e.sourceHandle === 'done');

                        // ── Execute body for each item with isolated context ──
                        for (let i = 0; i < arr.length; i++) {
                            const iterContext = {
                                ...context,         // inherit parent context
                                item: arr[i],       // current item
                                __loopIndex: i,
                                __loopTotal: arr.length,
                            };

                            // Temporarily swap context for this iteration
                            Object.assign(context, iterContext);

                            if (nextItemEdge) {
                                const iterVisited = new Set<string>();
                                const iterTraverse = async (nid: string, d = 0): Promise<void> => {
                                    if (d > 20 || iterVisited.has(nid) || nid === nodeId) return;
                                    iterVisited.add(nid);
                                    await traverseNode(nid, d);
                                };
                                await iterTraverse(nextItemEdge.target, depth + 1);
                            }
                        }

                        // Restore non-item context keys
                        delete context.item;
                        delete context.__loopIndex;
                        delete context.__loopTotal;

                        // Execute DONE path
                        if (doneEdge) await traverseNode(doneEdge.target, depth + 1);
                        return; // routing handled inside
                    }

                    logEntry.status = 'SUCCESS';
                } catch (err: any) {
                    logEntry.status = 'ERROR';
                    logEntry.details = err.message;
                    console.error(`[DAG Engine] Node ${nodeId} error:`, err);
                }

                logs.push(logEntry);
                if (logEntry.status === 'ERROR') return; // halt branch on error

                // ── Edge routing ───────────────────────────────────────────────
                const outgoingEdges = edges.filter(e => e.source === nodeId);
                const nextTasks: Promise<void>[] = [];

                if (node.type === 'conditionNode' && conditionResult !== null) {
                    const targetHandle = conditionResult ? 'true' : 'false';
                    const match = outgoingEdges.find(e => e.sourceHandle === targetHandle);
                    if (match) nextTasks.push(traverseNode(match.target, depth + 1));
                } else if (node.type !== 'switchNode' && node.type !== 'loopNode') {
                    // switchNode and loopNode handle their own routing above
                    for (const edge of outgoingEdges) {
                        nextTasks.push(traverseNode(edge.target, depth + 1));
                    }
                }

                await Promise.all(nextTasks);
            };

            const startNode = resumeFromNodeId
                ? nodesMap.get(resumeFromNodeId)
                : nodes.find(n => n.type === 'triggerNode');

            if (startNode) await traverseNode(startNode.id);
        }

        await prisma.workflowExecution.update({
            where: { id: execution.id },
            data: { status: 'SUCCESS', completedAt: new Date(), logs: logs as any },
        });

    } catch (error: any) {
        console.error(`[DAG Engine] Workflow ${workflowId} failed:`, error);
        await prisma.workflowExecution.update({
            where: { id: execution.id },
            data: { status: 'FAILED', completedAt: new Date(), logs: [{ error: error.message, ts: new Date().toISOString() }] as any },
        });

        // ── AUTO-ALERT: Notificar admins sobre fallo ─────────────────────────
        try {
            const wf = await prisma.workflow.findUnique({ where: { id: workflowId }, select: { name: true, companyId: true } });
            if (wf) {
                const admins = await prisma.companyUser.findMany({
                    where: { 
                        companyId: wf.companyId, 
                        OR: [{ roleName: "admin" }, { roleName: "owner" }] 
                    },
                    select: { userId: true }
                });
                if (admins.length > 0) {
                    await prisma.notification.createMany({
                        data: admins.map(a => ({
                            userId: a.userId,
                            companyId: wf.companyId,
                            title: `⚠️ Workflow Fallido: ${wf.name}`,
                            message: `Error: ${error.message?.substring(0, 200)}. Revisa Automatización → Ejecuciones.`,
                            type: "WORKFLOW",
                            isRead: false,
                        }))
                    });
                }
            }
        } catch (alertErr) {
            console.error("[AutoAlert] Failed to send failure notification:", alertErr);
        }
        // ─────────────────────────────────────────────────────────────────────
    }
}

// --- CRUD ---
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function saveUserWorkflow(data: any) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const companyUser = await prisma.companyUser.findFirst({
        where: { userId: session.user.id }
    });
    if (!companyUser) return { success: false, error: "No company found" };

    return await saveWorkflow(companyUser.companyId, data);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function saveWorkflow(companyId: string, data: any) {
    try {
        if (data.id) {
            await prisma.workflow.update({
                where: { id: data.id },
                data: {
                    name: data.name,
                    triggerType: data.triggerType,
                    triggerConfig: data.triggerConfig || {},
                    steps: data.steps,
                    isActive: data.isActive
                }
            });
        } else {
            await prisma.workflow.create({
                data: {
                    companyId,
                    name: data.name,
                    triggerType: data.triggerType,
                    triggerConfig: data.triggerConfig || {},
                    steps: data.steps,
                    isActive: data.isActive
                }
            });
        }
        return { success: true };
    } catch (e: any) /* eslint-disable-line @typescript-eslint/no-explicit-any */ {
        console.error(e);
        return { success: false, error: e.message };
    }
}

export async function getLatestWorkflow(companyId?: string) {
    const session = await auth();
    if (!session?.user?.id) return null;

    // Resolve companyId from session if not provided — prevents cross-tenant leak
    let resolvedCompanyId = companyId;
    if (!resolvedCompanyId) {
        const cu = await prisma.companyUser.findFirst({
            where: { userId: session.user.id },
            select: { companyId: true },
        });
        resolvedCompanyId = cu?.companyId;
    }
    if (!resolvedCompanyId) return null;

    try {
        return await prisma.workflow.findFirst({
            where: { companyId: resolvedCompanyId },
            orderBy: { createdAt: 'desc' },
        });
    } catch (e) {
        return null;
    }
}


export async function getWorkflowById(id: string) {
    const session = await auth();
    if (!session?.user?.id) return null;

    try {
        return await prisma.workflow.findUnique({
            where: { id },
        });
    } catch (e) {
        return null;
    }
}

export async function getWorkflows(companyId: string) {
    const session = await auth();
    if (!session?.user?.id) return [];

    try {
        return await prisma.workflow.findMany({
            where: { companyId },
            include: {
                _count: {
                    select: { executions: true }
                }
            },
            orderBy: { createdAt: 'desc' },
        });
    } catch (e) {
        return [];
    }
}

export async function deleteWorkflow(id: string) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    try {
        await prisma.workflow.delete({ where: { id } });
        return { success: true };
    } catch (e: any) /* eslint-disable-line @typescript-eslint/no-explicit-any */ {
        return { success: false, error: e.message };
    }
}

export async function toggleWorkflow(id: string, isActive: boolean) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    try {
        await prisma.workflow.update({
            where: { id },
            data: { isActive }
        });
        return { success: true };
    } catch (e: any) /* eslint-disable-line @typescript-eslint/no-explicit-any */ {
        return { success: false, error: e.message };
    }
}

export async function bulkDeleteWorkflows(ids: string[]) {
    try {
        await prisma.workflow.deleteMany({
            where: { id: { in: ids } }
        });
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function bulkToggleWorkflows(ids: string[], isActive: boolean) {
    try {
        await prisma.workflow.updateMany({
            where: { id: { in: ids } },
            data: { isActive }
        });
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}
