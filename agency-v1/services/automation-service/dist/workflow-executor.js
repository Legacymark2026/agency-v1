"use strict";
/**
 * Workflow Executor Engine — Migrated from apps/web/lib/workflow-executor.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Full DAG-based workflow runtime with SAGA rollback, WAIT/RESUME,
 * branching, DB writes, transforms, webhooks, and AI agent invocation.
 *
 * Changed from original:
 *  - import { prisma } from "@agency/database" instead of "@/lib/prisma"
 *  - AI_AGENT step calls ai-engine via HTTP instead of direct import
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.runWorkflow = runWorkflow;
exports.resumeWorkflow = resumeWorkflow;
const database_1 = require("@agency/database");
// ─── Main Entry ──────────────────────────────────────────────────────────────
async function runWorkflow(workflowId, triggerData) {
    const workflow = await database_1.prisma.workflow.findUnique({ where: { id: workflowId } });
    if (!workflow)
        return { success: false, error: "Workflow not found" };
    if (!workflow.isActive)
        return { success: false, error: "Workflow is inactive" };
    const execution = await database_1.prisma.workflowExecution.create({
        data: { workflowId, status: "RUNNING", currentStep: 0, logs: [] },
    });
    const context = {
        workflowId, executionId: execution.id,
        companyId: workflow.companyId || "",
        triggerData, variables: { ...triggerData }, stepHistory: [],
    };
    const steps = workflow.steps ?? [];
    if (steps.length === 0) {
        await markExecution(execution.id, "SUCCESS", context);
        return { success: true, executionId: execution.id };
    }
    try {
        const result = await executeStepChain(steps, steps[0].id, context);
        await markExecution(execution.id, result.suspended ? "WAITING" : "SUCCESS", context);
        return { success: true, executionId: execution.id };
    }
    catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        await markExecution(execution.id, "FAILED", context, errorMsg);
        return { success: false, executionId: execution.id, error: errorMsg };
    }
}
// ─── Resume ──────────────────────────────────────────────────────────────────
async function resumeWorkflow(executionId, resumeData) {
    const execution = await database_1.prisma.workflowExecution.findUnique({
        where: { id: executionId }, include: { workflow: true },
    });
    if (!execution)
        return { success: false, error: "Execution not found" };
    if (execution.status !== "WAITING")
        return { success: false, error: "Not in WAITING state" };
    const context = execution.contextSnapshot ?? {
        workflowId: execution.workflowId, executionId,
        companyId: execution.workflow.companyId,
        triggerData: {}, variables: {}, stepHistory: [],
    };
    if (resumeData)
        Object.assign(context.variables, resumeData);
    const steps = execution.workflow.steps ?? [];
    const nextStepId = getNextStepAfterCurrent(steps, execution.currentStep);
    if (!nextStepId) {
        await markExecution(executionId, "SUCCESS", context);
        return { success: true };
    }
    try {
        await database_1.prisma.workflowExecution.update({ where: { id: executionId }, data: { status: "RUNNING" } });
        const result = await executeStepChain(steps, nextStepId, context);
        await markExecution(executionId, result.suspended ? "WAITING" : "SUCCESS", context);
        return { success: true };
    }
    catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        await markExecution(executionId, "FAILED", context, errorMsg);
        return { success: false, error: errorMsg };
    }
}
// ─── Step Chain Executor (DAG Walker with SAGA Rollback) ─────────────────────
async function executeStepChain(steps, startStepId, context) {
    const stepMap = new Map(steps.map((s) => [s.id, s]));
    let currentId = startStepId;
    let safetyCounter = 0;
    try {
        while (currentId && safetyCounter < 50) {
            safetyCounter++;
            const step = stepMap.get(currentId);
            if (!step) {
                console.warn(`[WorkflowExecutor] Step ${currentId} not found`);
                break;
            }
            const result = await executeStep(step, context);
            context.stepHistory.push({ stepId: step.id, result: result.output, executedAt: new Date().toISOString() });
            if (result.suspended) {
                await database_1.prisma.workflowExecution.update({
                    where: { id: context.executionId },
                    data: { status: "WAITING", currentStep: steps.indexOf(step),
                        contextSnapshot: context, resumeAt: result.resumeAt },
                });
                return { suspended: true };
            }
            if (result.error)
                throw new Error(`Step ${step.id} (${step.type}) failed: ${result.error}`);
            currentId = result.nextId ?? step.nextId;
        }
    }
    catch (chainError) {
        // SAGA ROLLBACK
        console.error(`[WorkflowExecutor] Execution failed. Initiating Saga Rollback...`, chainError);
        for (let i = context.stepHistory.length - 1; i >= 0; i--) {
            const hist = context.stepHistory[i];
            const originalStep = stepMap.get(hist.stepId);
            if (originalStep?.compensate) {
                try {
                    await executeStep({ id: `${originalStep.id}-undo`, type: originalStep.compensate.type, config: originalStep.compensate.config }, context);
                }
                catch (compErr) {
                    console.error(`[Compensation] Step ${originalStep.id} FAILED:`, compErr);
                }
            }
        }
        throw chainError;
    }
    return { suspended: false };
}
async function executeStep(step, context) {
    console.log(`[WorkflowExecutor] Executing step ${step.id} (${step.type})`);
    try {
        switch (step.type) {
            case "ACTION": return await executeAction(step, context);
            case "BRANCH": return executeBranch(step, context);
            case "WAIT": return executeWait(step);
            case "NOTIFY": return await executeNotify(step, context);
            case "WEBHOOK": return await executeWebhook(step, context);
            case "AI_AGENT": return await executeAIAgent(step, context);
            case "DB_WRITE": return await executeDbWrite(step, context);
            case "TRANSFORM": return executeTransform(step, context);
            default: return { error: `Unknown step type: ${step.type}` };
        }
    }
    catch (err) {
        return { error: err instanceof Error ? err.message : String(err) };
    }
}
// ─── ACTION — HTTP Request ───────────────────────────────────────────────────
async function executeAction(step, context) {
    const { url, method = "POST", headers = {}, bodyTemplate } = step.config;
    if (!url)
        return { error: "ACTION step missing 'url'" };
    const resolvedBody = bodyTemplate ? interpolate(bodyTemplate, context.variables) : undefined;
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json", ...headers }, body: resolvedBody, signal: AbortSignal.timeout(15_000) });
    const output = res.ok ? await res.json().catch(() => ({ status: res.status })) : { error: res.statusText };
    return { output };
}
// ─── BRANCH ──────────────────────────────────────────────────────────────────
function executeBranch(step, context) {
    if (!step.branches?.length)
        return { nextId: step.nextId };
    for (const branch of step.branches) {
        if (evaluateCondition(branch.condition, context.variables))
            return { nextId: branch.nextId, output: { matched: branch.condition } };
    }
    return { nextId: step.nextId, output: { matched: null } };
}
// ─── WAIT ────────────────────────────────────────────────────────────────────
function executeWait(step) {
    const { delayMinutes, until } = step.config;
    const resumeAt = until ? new Date(until) : new Date(Date.now() + (delayMinutes ?? 60) * 60 * 1000);
    return { suspended: true, resumeAt };
}
// ─── NOTIFY ──────────────────────────────────────────────────────────────────
async function executeNotify(step, context) {
    const { userId, title, message, type = "WORKFLOW" } = step.config;
    if (!userId || !title)
        return { error: "NOTIFY requires 'userId' and 'title'" };
    try {
        await database_1.prisma.notification.create({ data: { userId, companyId: context.companyId, title: interpolate(title, context.variables), message: message ? interpolate(message, context.variables) : "", type, isRead: false } });
    }
    catch (e) {
        console.warn("[WorkflowExecutor] NOTIFY failed:", e);
    }
    return { output: { notified: userId } };
}
// ─── WEBHOOK ─────────────────────────────────────────────────────────────────
async function executeWebhook(step, context) {
    const { webhookUrl, secret, bodyTemplate, continueOnError } = step.config;
    if (!webhookUrl)
        return { error: "WEBHOOK missing 'webhookUrl'" };
    const body = bodyTemplate ? interpolate(bodyTemplate, context.variables) : JSON.stringify(context.variables);
    const headers = { "Content-Type": "application/json" };
    if (secret)
        headers["x-webhook-secret"] = secret;
    try {
        const res = await fetch(webhookUrl, { method: "POST", headers, body, signal: AbortSignal.timeout(10_000) });
        if (!res.ok && !continueOnError)
            return { error: `Webhook HTTP ${res.status}` };
        return { output: { status: res.status, ok: res.ok } };
    }
    catch (e) {
        if (!continueOnError)
            return { error: e instanceof Error ? e.message : String(e) };
        return { output: { error: e instanceof Error ? e.message : String(e), ok: false } };
    }
}
// ─── AI_AGENT — Calls AI Engine service via HTTP ─────────────────────────────
async function executeAIAgent(step, context) {
    const { agentId, messageTemplate } = step.config;
    if (!agentId)
        return { error: "AI_AGENT requires 'agentId'" };
    const userMessage = messageTemplate ? interpolate(messageTemplate, context.variables) : JSON.stringify(context.variables);
    try {
        // Call AI Engine microservice instead of direct import
        const AI_ENGINE_URL = process.env.AI_ENGINE_URL || "http://ai-engine:4004";
        const res = await fetch(`${AI_ENGINE_URL}/api/agents/${agentId}/run`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ companyId: context.companyId, userMessage }),
            signal: AbortSignal.timeout(30_000),
        });
        const result = (await res.json());
        context.variables["ai_response"] = result.result;
        return { output: result };
    }
    catch (err) {
        return { error: err instanceof Error ? err.message : String(err) };
    }
}
// ─── DB_WRITE ────────────────────────────────────────────────────────────────
async function executeDbWrite(step, context) {
    const { model, operation, data, where } = step.config;
    if (!model || !operation)
        return { error: "DB_WRITE requires 'model' and 'operation'" };
    const ALLOWED_MODELS = ["lead", "conversation", "message", "deal", "task", "notification"];
    if (!ALLOWED_MODELS.includes(model.toLowerCase()))
        return { error: `DB_WRITE: model '${model}' not allowed.` };
    try {
        const client = database_1.prisma[model.toLowerCase()];
        let result;
        if (operation === "create")
            result = await client.create({ data: { ...data, companyId: context.companyId } });
        else if (operation === "update" && where)
            result = await client.update({ where, data });
        else if (operation === "upsert" && where)
            result = await client.upsert({ where, create: { ...data, companyId: context.companyId }, update: data });
        else if (operation === "delete" && where)
            result = await client.delete({ where });
        else
            return { error: `Invalid operation '${operation}'` };
        return { output: result };
    }
    catch (err) {
        return { error: err instanceof Error ? err.message : String(err) };
    }
}
// ─── TRANSFORM ───────────────────────────────────────────────────────────────
function executeTransform(step, context) {
    const { mappings } = step.config;
    if (!mappings)
        return { output: {} };
    const output = {};
    for (const mapping of mappings) {
        const rawValue = getNestedValue(context.variables, mapping.from);
        let value = rawValue;
        if (mapping.transform) {
            switch (mapping.transform) {
                case "uppercase":
                    value = typeof rawValue === "string" ? rawValue.toUpperCase() : rawValue;
                    break;
                case "lowercase":
                    value = typeof rawValue === "string" ? rawValue.toLowerCase() : rawValue;
                    break;
                case "stringify":
                    value = JSON.stringify(rawValue);
                    break;
                case "number":
                    value = Number(rawValue);
                    break;
                case "boolean":
                    value = Boolean(rawValue);
                    break;
            }
        }
        setNestedValue(context.variables, mapping.to, value);
        output[mapping.to] = value;
    }
    return { output };
}
// ─── Helpers ─────────────────────────────────────────────────────────────────
function evaluateCondition(c, vars) {
    const actual = getNestedValue(vars, c.field);
    switch (c.operator) {
        case "eq": return actual === c.value;
        case "neq": return actual !== c.value;
        case "gt": return actual > c.value;
        case "lt": return actual < c.value;
        case "gte": return actual >= c.value;
        case "lte": return actual <= c.value;
        case "contains": return typeof actual === "string" && actual.includes(String(c.value));
        case "regex": return typeof actual === "string" && new RegExp(String(c.value)).test(actual);
        case "exists": return actual !== undefined && actual !== null;
        case "not_exists": return actual === undefined || actual === null;
        default: return false;
    }
}
function interpolate(template, vars) {
    return template.replace(/\{\{([^}]+)\}\}/g, (_, key) => {
        const value = getNestedValue(vars, key.trim());
        return value !== undefined && value !== null ? String(value) : "";
    });
}
function getNestedValue(obj, path) {
    return path.split(".").reduce((acc, key) => {
        if (acc && typeof acc === "object")
            return acc[key];
        return undefined;
    }, obj);
}
function setNestedValue(obj, path, value) {
    const keys = path.split(".");
    let current = obj;
    for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]] || typeof current[keys[i]] !== "object")
            current[keys[i]] = {};
        current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
}
function getNextStepAfterCurrent(steps, currentIndex) {
    if (currentIndex + 1 < steps.length)
        return steps[currentIndex + 1].id;
    return undefined;
}
async function markExecution(executionId, status, context, errorMsg) {
    await database_1.prisma.workflowExecution.update({
        where: { id: executionId },
        data: { status, completedAt: status !== "WAITING" ? new Date() : undefined, contextSnapshot: context, logs: context.stepHistory },
    });
    if (errorMsg)
        console.error(`[WorkflowExecutor] Execution ${executionId} FAILED: ${errorMsg}`);
    else
        console.log(`[WorkflowExecutor] Execution ${executionId} → ${status}`);
}
//# sourceMappingURL=workflow-executor.js.map