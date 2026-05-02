import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Handlebars from "handlebars";

// ─────────────────────────────────────────────────────────────────────────────
// DRY-RUN EXECUTOR — mirrors automation.ts logic but with no real side effects
// ─────────────────────────────────────────────────────────────────────────────

async function dryRunAction(
    actionType: string,
    config: Record<string, any>,
    context: Record<string, any>
): Promise<{ action: string; result: string; skipped?: boolean }> {
    const render = (tpl: string) => {
        try { return Handlebars.compile(tpl)(context); } catch { return tpl; }
    };

    switch (actionType) {
        case "SEND_EMAIL": {
            const to = context[config.toVariable || "email"] || config.to || "{{unresolved}}";
            const subject = render(config.subject || "Test Email");
            return { action: "SEND_EMAIL", result: `[DRY-RUN] Would send email to "${to}" — Subject: "${subject}"`, skipped: true };
        }
        case "UPDATE_DEAL": {
            return { action: "UPDATE_DEAL", result: `[DRY-RUN] Would update deal stage → "${config.stage || config.dealStage || "N/A"}"`, skipped: true };
        }
        case "CREATE_TASK": {
            const title = render(config.taskTitle || config.title || "Task");
            return { action: "CREATE_TASK", result: `[DRY-RUN] Would create task: "${title}" (priority: ${config.priority || "MEDIUM"})`, skipped: true };
        }
        case "ADD_TAG": {
            return { action: "ADD_TAG", result: `[DRY-RUN] Would add tag: "${config.tag}"`, skipped: true };
        }
        case "REMOVE_TAG": {
            return { action: "REMOVE_TAG", result: `[DRY-RUN] Would remove tag: "${config.tag}"`, skipped: true };
        }
        case "SEND_NOTIFICATION": {
            const msg = render(config.message || "");
            return { action: "SEND_NOTIFICATION", result: `[DRY-RUN] Would notify user: "${msg}"`, skipped: true };
        }
        case "HTTP": {
            return { action: "HTTP", result: `[DRY-RUN] Would call ${config.method || "POST"} ${config.url}`, skipped: true };
        }
        case "SEND_WHATSAPP": {
            const phone = context[config.phoneVariable || "phone"] || config.phone || "{{unresolved}}";
            const msg = render(config.message || "");
            return { action: "SEND_WHATSAPP", result: `[DRY-RUN] Would send WhatsApp to "${phone}": "${msg}"`, skipped: true };
        }
        case "AI_AGENT": {
            const prompt = render(config.messageTemplate || config.promptContext || "");
            context.__aiResponse = "[SIMULATED AI RESPONSE]";
            context.ai_response = "[SIMULATED AI RESPONSE]";
            return { action: "AI_AGENT", result: `[DRY-RUN] Would invoke AI Agent (id: ${config.agentId}) with: "${prompt.substring(0, 120)}..."` };
        }
        case "DB_WRITE": {
            return { action: "DB_WRITE", result: `[DRY-RUN] Would ${config.operation} on model "${config.model}"`, skipped: true };
        }
        case "FIND_RECORD": {
            // Simulate finding a record
            context.__foundRecord = { id: "sim-id", email: context.email, name: context.name || "Simulated Contact" };
            Object.assign(context, context.__foundRecord);
            return { action: "FIND_RECORD", result: `[DRY-RUN] Would query "${config.searchBy}" = "${context[config.searchBy] || config.searchValue}". Injected simulated record.` };
        }
        case "RUN_CODE": {
            return { action: "RUN_CODE", result: `[DRY-RUN] Would execute JS sandbox:\n${(config.code || "").substring(0, 200)}`, skipped: true };
        }
        case "CALENDAR_EVENT": {
            return { action: "CALENDAR_EVENT", result: `[DRY-RUN] Would create calendar event: "${config.eventTitle}" for ${config.attendeeEmail || "{{lead.email}}"}`, skipped: true };
        }
        case "KNOWLEDGE_RAG": {
            context.__ragResult = "[SIMULATED RAG RESULT: Relevant document found]";
            return { action: "KNOWLEDGE_RAG", result: `[DRY-RUN] Would search knowledge base (scope: ${config.documentSource || "global"}) for: "${context[config.queryVariable] || config.queryVariable}"` };
        }
        default:
            return { action: actionType, result: `[DRY-RUN] Unknown action type: ${actionType}` };
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// DAG Traversal (dry-run mode)
// ─────────────────────────────────────────────────────────────────────────────
async function dryRunDAG(
    nodes: any[], 
    edges: any[], 
    context: Record<string, any>
): Promise<any[]> {
    const logs: any[] = [];
    const nodesMap = new Map<string, any>(nodes.map((n) => [n.id, n]));
    const visited = new Set<string>();

    const traverse = async (nodeId: string, depth = 0): Promise<void> => {
        if (depth > 30 || visited.has(nodeId)) return;
        visited.add(nodeId);

        const node = nodesMap.get(nodeId);
        if (!node) return;

        const logEntry: any = {
            nodeId: node.id,
            nodeType: node.type,
            label: node.data?.label || node.data?.actionType || node.type,
            timestamp: new Date().toISOString(),
            status: "SUCCESS",
            details: "",
        };

        let conditionResult: boolean | null = null;
        let switchBranch: string | null = null;

        try {
            // ── triggerNode ──────────────────────────────────────────
            if (node.type === "triggerNode") {
                logEntry.details = `✅ Trigger: ${node.data?.triggerType || "START"} — Context initialized with test payload`;
            }
            // ── actionNode / crmActionNode ───────────────────────────
            else if (node.type === "actionNode" || node.type === "crmActionNode") {
                const actionType = node.data?.actionType || node.data?.type || "SEND_EMAIL";
                const res = await dryRunAction(actionType, node.data || {}, context);
                logEntry.details = res.result;
                if (res.skipped) logEntry.dryRun = true;
            }
            // ── conditionNode ────────────────────────────────────────
            else if (node.type === "conditionNode") {
                const variable = node.data?.variable || "email";
                const operator = node.data?.operator || "contains";
                const targetVal = String(node.data?.conditionValue || node.data?.value || "");
                const actualVal = String(context[variable] || "");
                switch (operator) {
                    case "equals":     conditionResult = actualVal.toLowerCase() === targetVal.toLowerCase(); break;
                    case "not_equals": conditionResult = actualVal.toLowerCase() !== targetVal.toLowerCase(); break;
                    case "gt":         conditionResult = parseFloat(actualVal) > parseFloat(targetVal); break;
                    case "lt":         conditionResult = parseFloat(actualVal) < parseFloat(targetVal); break;
                    default:           conditionResult = actualVal.toLowerCase().includes(targetVal.toLowerCase());
                }
                logEntry.details = `IF "${variable}" (="${actualVal}") ${operator} "${targetVal}" → ${conditionResult ? "✅ TRUE" : "❌ FALSE"}`;
            }
            // ── switchNode ───────────────────────────────────────────
            else if (node.type === "switchNode") {
                const variable = node.data?.variable || "status";
                const actualVal = String(context[variable] || "");
                const branches: any[] = node.data?.branches || [];
                const match = branches.find((b: any) => 
                    actualVal.toLowerCase() === String(b.value || "").toLowerCase() ||
                    actualVal.toLowerCase().includes(String(b.value || "").toLowerCase())
                );
                switchBranch = match?.id || null;
                logEntry.details = `SWITCH "${variable}" (="${actualVal}") → ${match ? `Branch: "${match.label}"` : "No match (default)"}`;
            }
            // ── waitNode ─────────────────────────────────────────────
            else if (node.type === "waitNode") {
                let ms = parseInt(node.data?.delayValue || "1") * 1000;
                if (node.data?.delayUnit === "m") ms *= 60;
                if (node.data?.delayUnit === "h") ms *= 3600;
                if (node.data?.delayUnit === "d") ms *= 86400;
                const humanDelay = node.data?.delayUnit === "d"
                    ? `${node.data.delayValue} día(s)`
                    : node.data?.delayUnit === "h"
                    ? `${node.data.delayValue} hora(s)`
                    : `${node.data?.delayValue} minuto(s)`;
                logEntry.details = `[DRY-RUN] Would WAIT ${humanDelay} (${ms}ms) — skipped in test mode`;
                logEntry.dryRun = true;
            }
            // ── loopNode ─────────────────────────────────────────────
            else if (node.type === "loopNode") {
                const iterVar = node.data?.iterableVariable || "items";
                const arr = context[iterVar] || [{ _sim: 1 }, { _sim: 2 }];
                logEntry.details = `LOOP over "${iterVar}" — ${Array.isArray(arr) ? arr.length : "?"} items (simulating 2 iterations)`;
            }
            // ── aiNode ───────────────────────────────────────────────
            else if (node.type === "aiNode") {
                context.__aiResponse = "[SIMULATED AI RESPONSE]";
                context.ai_response = "[SIMULATED AI RESPONSE]";
                logEntry.details = `[DRY-RUN] AI Agent would run task: "${node.data?.aiTask || "GENERATION"}" — Simulated response injected`;
                logEntry.dryRun = true;
            }
            // ── httpNode ─────────────────────────────────────────────
            else if (node.type === "httpNode") {
                logEntry.details = `[DRY-RUN] Would call ${node.data?.method || "POST"} ${node.data?.url}`;
                logEntry.dryRun = true;
            }
            // ── slackNode ────────────────────────────────────────────
            else if (node.type === "slackNode") {
                const msg = Handlebars.compile(node.data?.message || "")(context);
                logEntry.details = `[DRY-RUN] Would send Slack: "${msg.substring(0, 100)}"`;
                logEntry.dryRun = true;
            }
            // ── whatsappNode / smsNode ───────────────────────────────
            else if (node.type === "whatsappNode" || node.type === "smsNode") {
                const phone = context[node.data?.phoneVariable || "phone"] || node.data?.phone || "{{unresolved}}";
                logEntry.details = `[DRY-RUN] Would send ${node.type === "whatsappNode" ? "WhatsApp" : "SMS"} to "${phone}"`;
                logEntry.dryRun = true;
            }
            else {
                logEntry.details = `[DRY-RUN] Node type "${node.type}" processed`;
            }

            logEntry.status = "SUCCESS";
        } catch (err: any) {
            logEntry.status = "ERROR";
            logEntry.details = `Error: ${err.message}`;
        }

        logs.push(logEntry);

        // ── Edge routing ──────────────────────────────────────────────
        const outEdges = edges.filter((e: any) => e.source === nodeId);
        const nextTasks: Promise<void>[] = [];

        if (conditionResult !== null) {
            const handle = conditionResult ? "true" : "false";
            const match = outEdges.find((e: any) => e.sourceHandle === handle);
            if (match) nextTasks.push(traverse(match.target, depth + 1));
        } else if (switchBranch) {
            const match = outEdges.find((e: any) => e.sourceHandle === switchBranch);
            const fallback = outEdges.find((e: any) => e.sourceHandle === "default") || outEdges[0];
            const target = match || fallback;
            if (target) nextTasks.push(traverse(target.target, depth + 1));
        } else {
            for (const edge of outEdges) {
                nextTasks.push(traverse(edge.target, depth + 1));
            }
        }

        await Promise.all(nextTasks);
    };

    const startNode = nodes.find((n: any) => n.type === "triggerNode");
    if (startNode) await traverse(startNode.id);

    return logs;
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/automation/test
// Body: { workflowId: string, testPayload: Record<string, any> }
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { workflowId, testPayload = {} } = body;

        if (!workflowId) {
            return NextResponse.json({ error: "workflowId is required" }, { status: 400 });
        }

        const workflow = await prisma.workflow.findUnique({ where: { id: workflowId } });
        if (!workflow) {
            return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
        }

        const stepsData = workflow.steps as any;
        const startTime = Date.now();

        // Build mutable context from test payload
        const context: Record<string, any> = {
            // Defaults so templates don't break
            email: "test@example.com",
            name: "Test User",
            phone: "+1234567890",
            companyName: "Test Corp",
            leadScore: 75,
            stage: "PROPOSAL",
            tier: "VIP",
            language: "es",
            // Merge user-provided payload (overrides defaults)
            ...testPayload,
        };

        let logs: any[] = [];

        if (stepsData?.nodes && stepsData?.edges) {
            // DAG format — full visual workflow
            logs = await dryRunDAG(stepsData.nodes, stepsData.edges, context);
        } else if (Array.isArray(stepsData)) {
            // Legacy array format
            for (let i = 0; i < stepsData.length; i++) {
                const step = stepsData[i];
                const res = await dryRunAction(step.type, step.config || step, context);
                logs.push({
                    nodeId: `step_${i}`,
                    nodeType: step.type,
                    label: step.type,
                    timestamp: new Date().toISOString(),
                    status: "SUCCESS",
                    details: res.result,
                    dryRun: res.skipped,
                });
            }
        } else {
            return NextResponse.json({ error: "Invalid workflow steps format" }, { status: 400 });
        }

        const durationMs = Date.now() - startTime;

        return NextResponse.json({
            success: true,
            workflowId,
            workflowName: workflow.name,
            triggerType: workflow.triggerType,
            durationMs,
            nodesExecuted: logs.length,
            contextSnapshot: context,
            logs,
        });

    } catch (err: any) {
        console.error("[DryRun] Error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
