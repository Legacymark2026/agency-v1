/**
 * lib/workflow-executor.ts — Workflow Runtime Engine
 * ─────────────────────────────────────────────────────────────────────────────
 * Interpreta y ejecuta los flujos de trabajo definidos en el modelo `Workflow`.
 *
 * ARQUITECTURA: Trigger → Filter → Action → Branch → Wait → Iterate
 *
 * Cada `Workflow` tiene un campo `steps: Json` con el siguiente schema:
 *
 * steps: Array<WorkflowStep>
 *
 * WorkflowStep = {
 *   id:       string,     — Unique step ID dentro del flujo
 *   type:     StepType,   — "ACTION" | "BRANCH" | "WAIT" | "NOTIFY" | "WEBHOOK" | "AI_AGENT"
 *   config:   object,     — Configuración específica del tipo
 *   nextId?:  string,     — Siguiente paso a ejecutar (linear)
 *   branches?: Array<{    — Solo para type=BRANCH
 *     condition: FilterCondition,
 *     nextId: string,
 *   }>
 * }
 *
 * El estado de ejecución se persiste en `WorkflowExecution.contextSnapshot`
 * para soportar WAIT/RESUME sin perder el contexto entre ejecuciones.
 */

import { prisma } from "@/lib/prisma";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type StepType =
    | "ACTION"
    | "BRANCH"
    | "WAIT"
    | "NOTIFY"
    | "WEBHOOK"
    | "AI_AGENT"
    | "DB_WRITE"
    | "TRANSFORM";

export interface FilterCondition {
    field: string;
    operator: "eq" | "neq" | "gt" | "lt" | "gte" | "lte" | "contains" | "regex" | "exists" | "not_exists";
    value?: unknown;
    logicalOperator?: "AND" | "OR";
}

export interface BranchConfig {
    condition: FilterCondition;
    nextId: string;
}

export interface WorkflowStep {
    id: string;
    type: StepType;
    label?: string;
    config: Record<string, unknown>;
    nextId?: string;
    branches?: BranchConfig[];
    compensate?: { type: StepType; config: Record<string, unknown> };
}

export interface ExecutionContext {
    workflowId: string;
    executionId: string;
    companyId: string;
    triggerData: Record<string, unknown>;
    variables: Record<string, unknown>;
    stepHistory: Array<{ stepId: string; result: unknown; executedAt: string }>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Entry — Run Workflow from Trigger
// ─────────────────────────────────────────────────────────────────────────────
export async function runWorkflow(
    workflowId: string,
    triggerData: Record<string, unknown>
): Promise<{ success: boolean; executionId?: string; error?: string }> {
    const workflow = await prisma.workflow.findUnique({ where: { id: workflowId } });

    if (!workflow) return { success: false, error: "Workflow not found" };
    if (!workflow.isActive) return { success: false, error: "Workflow is inactive" };

    // Create execution record
    const execution = await prisma.workflowExecution.create({
        data: {
            workflowId,
            status: "RUNNING",
            currentStep: 0,
            logs: [],
        },
    });

    const context: ExecutionContext = {
        workflowId,
        executionId: execution.id,
        companyId: workflow.companyId || "",
        triggerData,
        variables: { ...triggerData },
        stepHistory: [],
    };

    // Build step index map
    const steps = (workflow.steps as unknown as WorkflowStep[]) ?? [];
    if (steps.length === 0) {
        await markExecution(execution.id, "SUCCESS", context);
        return { success: true, executionId: execution.id };
    }

    try {
        // Start from first step
        const result = await executeStepChain(steps, steps[0].id, context);
        await markExecution(execution.id, result.suspended ? "WAITING" : "SUCCESS", context);
        return { success: true, executionId: execution.id };
    } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        await markExecution(execution.id, "FAILED", context, errorMsg);
        return { success: false, executionId: execution.id, error: errorMsg };
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Resume — Continue a WAITING execution from a step
// ─────────────────────────────────────────────────────────────────────────────
export async function resumeWorkflow(
    executionId: string,
    resumeData?: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
    const execution = await prisma.workflowExecution.findUnique({
        where: { id: executionId },
        include: { workflow: true },
    });

    if (!execution) return { success: false, error: "Execution not found" };
    if (execution.status !== "WAITING") return { success: false, error: "Execution is not in WAITING state" };

    const context = (execution.contextSnapshot as unknown as ExecutionContext) ?? {
        workflowId: execution.workflowId,
        executionId,
        companyId: execution.workflow.companyId,
        triggerData: {},
        variables: {},
        stepHistory: [],
    };

    // Merge resume data into variables
    if (resumeData) Object.assign(context.variables, resumeData);

    const steps = (execution.workflow.steps as unknown as WorkflowStep[]) ?? [];
    const nextStepId = getNextStepAfterCurrent(steps, execution.currentStep);

    if (!nextStepId) {
        await markExecution(executionId, "SUCCESS", context);
        return { success: true };
    }

    try {
        await prisma.workflowExecution.update({
            where: { id: executionId },
            data: { status: "RUNNING" },
        });
        const result = await executeStepChain(steps, nextStepId, context);
        await markExecution(executionId, result.suspended ? "WAITING" : "SUCCESS", context);
        return { success: true };
    } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        await markExecution(executionId, "FAILED", context, errorMsg);
        return { success: false, error: errorMsg };
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Step Chain Executor — Walks the DAG
// ─────────────────────────────────────────────────────────────────────────────
async function executeStepChain(
    steps: WorkflowStep[],
    startStepId: string,
    context: ExecutionContext
): Promise<{ suspended: boolean }> {
    const stepMap = new Map(steps.map((s) => [s.id, s]));
    let currentId: string | undefined = startStepId;
    let safetyCounter = 0;

    try {
        while (currentId && safetyCounter < 50) {
            safetyCounter++;
            const step = stepMap.get(currentId);
            if (!step) {
                console.warn(`[WorkflowExecutor] Step ${currentId} not found — halting.`);
                break;
            }

            const result = await executeStep(step, context);

            context.stepHistory.push({
                stepId: step.id,
                result: result.output,
                executedAt: new Date().toISOString(),
            });

            if (result.suspended) {
                // Persist snapshot and halt — will be resumed externally
                await prisma.workflowExecution.update({
                    where: { id: context.executionId },
                    data: {
                        status: "WAITING",
                        currentStep: steps.indexOf(step),
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        contextSnapshot: context as any,
                        resumeAt: result.resumeAt,
                    },
                });
                return { suspended: true };
            }

            if (result.error) {
                throw new Error(`Step ${step.id} (${step.type}) failed: ${result.error}`);
            }

            currentId = result.nextId ?? step.nextId;
        }
    } catch (chainError) {
        // ── SAGA ROLLBACK (Compensating Transactions) ──
        console.error(`[WorkflowExecutor] Execution failed. Initiating Saga Rollback...`, chainError);
        // Traverse history in reverse order
        for (let i = context.stepHistory.length - 1; i >= 0; i--) {
            const hist = context.stepHistory[i];
            const originalStep = stepMap.get(hist.stepId);
            if (originalStep?.compensate) {
                console.log(`[WorkflowExecutor] Compensating step ${originalStep.id}...`);
                try {
                    const compStep: WorkflowStep = {
                        id: `${originalStep.id}-undo`,
                        type: originalStep.compensate.type,
                        config: originalStep.compensate.config,
                    };
                    // Execute compensate step with the same context
                    await executeStep(compStep, context);
                } catch (compErr) {
                    // Compensations shouldn't crash the whole rollback process, but log heavily
                    console.error(`[WorkflowExecutor] Compensation for step ${originalStep.id} FAILED:`, compErr);
                }
            }
        }
        // Re-throw to mark execution as FAILED
        throw chainError;
    }

    return { suspended: false };
}

// ─────────────────────────────────────────────────────────────────────────────
// Individual Step Executor
// ─────────────────────────────────────────────────────────────────────────────
interface StepResult {
    output?: unknown;
    nextId?: string;
    suspended?: boolean;
    resumeAt?: Date;
    error?: string;
}

async function executeStep(step: WorkflowStep, context: ExecutionContext): Promise<StepResult> {
    console.log(`[WorkflowExecutor] Executing step ${step.id} (${step.type})`);

    try {
        switch (step.type) {
            case "ACTION":
                return await executeAction(step, context);
            case "BRANCH":
                return executeBranch(step, context);
            case "WAIT":
                return executeWait(step, context);
            case "NOTIFY":
                return await executeNotify(step, context);
            case "WEBHOOK":
                return await executeWebhook(step, context);
            case "AI_AGENT":
                return await executeAIAgent(step, context);
            case "DB_WRITE":
                return await executeDbWrite(step, context);
            case "TRANSFORM":
                return executeTransform(step, context);
            default:
                return { error: `Unknown step type: ${(step as WorkflowStep).type}` };
        }
    } catch (err: unknown) {
        return { error: err instanceof Error ? err.message : String(err) };
    }
}

// ── ACTION — HTTP Request ─────────────────────────────────────────────────────
async function executeAction(step: WorkflowStep, context: ExecutionContext): Promise<StepResult> {
    const { url, method = "POST", headers = {}, bodyTemplate } = step.config as {
        url?: string;
        method?: string;
        headers?: Record<string, string>;
        bodyTemplate?: string;
    };

    if (!url) return { error: "ACTION step missing 'url' config" };

    const resolvedBody = bodyTemplate ? interpolate(bodyTemplate, context.variables) : undefined;

    const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", ...headers },
        body: resolvedBody,
        signal: AbortSignal.timeout(15_000),
    });

    const output = res.ok ? await res.json().catch(() => ({ status: res.status })) : { error: res.statusText };
    return { output };
}

// ── BRANCH — Conditional Router ──────────────────────────────────────────────
function executeBranch(step: WorkflowStep, context: ExecutionContext): StepResult {
    if (!step.branches?.length) return { nextId: step.nextId };

    for (const branch of step.branches) {
        if (evaluateCondition(branch.condition, context.variables)) {
            return { nextId: branch.nextId, output: { matched: branch.condition } };
        }
    }
    // No branch matched → follow default nextId
    return { nextId: step.nextId, output: { matched: null } };
}

// ── WAIT — Suspend Until Time or External Event ──────────────────────────────
function executeWait(step: WorkflowStep, context: ExecutionContext): StepResult {
    const { delayMinutes, until } = step.config as { delayMinutes?: number; until?: string };
    const resumeAt = until
        ? new Date(until)
        : new Date(Date.now() + (delayMinutes ?? 60) * 60 * 1000);

    return { suspended: true, resumeAt };
}

// ── NOTIFY — Internal Notification ───────────────────────────────────────────
async function executeNotify(step: WorkflowStep, context: ExecutionContext): Promise<StepResult> {
    const { userId, title, message, type = "WORKFLOW" } = step.config as {
        userId?: string;
        title?: string;
        message?: string;
        type?: string;
    };

    if (!userId || !title) return { error: "NOTIFY step requires 'userId' and 'title'" };

    try {
        await prisma.notification.create({
            data: {
                userId,
                companyId: context.companyId,
                title: interpolate(title, context.variables),
                message: message ? interpolate(message, context.variables) : "",
                type,
                isRead: false,
            },
        });
    } catch (e: unknown) {
        // Notification failure is non-fatal
        console.warn("[WorkflowExecutor] NOTIFY step failed:", e);
    }

    return { output: { notified: userId } };
}

// ── WEBHOOK — Outbound HTTP POST ──────────────────────────────────────────────
async function executeWebhook(step: WorkflowStep, context: ExecutionContext): Promise<StepResult> {
    const { webhookUrl, secret, bodyTemplate, continueOnError } = step.config as {
        webhookUrl?: string;
        secret?: string;
        bodyTemplate?: string;
        continueOnError?: boolean;
    };

    if (!webhookUrl) return { error: "WEBHOOK step missing 'webhookUrl'" };

    const body = bodyTemplate ? interpolate(bodyTemplate, context.variables) : JSON.stringify(context.variables);

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (secret) headers["x-webhook-secret"] = secret;

    try {
        const res = await fetch(webhookUrl, {
            method: "POST",
            headers,
            body,
            signal: AbortSignal.timeout(10_000),
        });
        
        // P2-B Silent Fail Protection
        if (!res.ok && !continueOnError) {
            return { error: `Webhook responded with HTTP ${res.status}: ${res.statusText}` };
        }
        
        return { output: { status: res.status, ok: res.ok } };
    } catch (e: unknown) {
        if (!continueOnError) {
            return { error: e instanceof Error ? e.message : String(e) };
        }
        // If continueOnError is true, return the error in the output object instead of failing the step
        return { output: { error: e instanceof Error ? e.message : String(e), ok: false } };
    }
}

// ── AI_AGENT — Invoke the Agent Runner ───────────────────────────────────────
async function executeAIAgent(step: WorkflowStep, context: ExecutionContext): Promise<StepResult> {
    const { agentId, messageTemplate } = step.config as { agentId?: string; messageTemplate?: string };

    if (!agentId) return { error: "AI_AGENT step requires 'agentId'" };

    const userMessage = messageTemplate
        ? interpolate(messageTemplate, context.variables)
        : JSON.stringify(context.variables);

    try {
        const { runAIAgent } = await import("@/lib/agent-runner");
        const result = await runAIAgent({
            agentId,
            companyId: context.companyId,
            userMessage,
        });
        // Persist AI result into variables for downstream steps
        context.variables["ai_response"] = result.result;
        return { output: result };
    } catch (err: unknown) {
        return { error: err instanceof Error ? err.message : String(err) };
    }
}

// ── DB_WRITE — Direct Prisma Upsert ──────────────────────────────────────────
async function executeDbWrite(step: WorkflowStep, context: ExecutionContext): Promise<StepResult> {
    const { model, operation, data, where } = step.config as {
        model?: string;
        operation?: "create" | "update" | "upsert" | "delete";
        data?: Record<string, unknown>;
        where?: Record<string, unknown>;
    };

    if (!model || !operation) return { error: "DB_WRITE requires 'model' and 'operation'" };

    // Security: only allow a whitelist of models for workflow writes
    const ALLOWED_MODELS = ["lead", "conversation", "message", "deal", "task", "notification"];
    if (!ALLOWED_MODELS.includes(model.toLowerCase())) {
        return { error: `DB_WRITE: model '${model}' is not in the allowed list.` };
    }

    try {
        // Dynamic Prisma client access with type cast
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const client = (prisma as unknown as Record<string, unknown>)[model.toLowerCase()] as {
            create: (args: unknown) => Promise<unknown>;
            update: (args: unknown) => Promise<unknown>;
            upsert: (args: unknown) => Promise<unknown>;
            delete: (args: unknown) => Promise<unknown>;
        };
        let result: unknown;

        if (operation === "create") {
            result = await client.create({ data: { ...data, companyId: context.companyId } });
        } else if (operation === "update" && where) {
            result = await client.update({ where, data });
        } else if (operation === "upsert" && where) {
            result = await client.upsert({ where, create: { ...data, companyId: context.companyId }, update: data });
        } else if (operation === "delete" && where) {
            result = await client.delete({ where });
        } else {
            return { error: `DB_WRITE: invalid operation '${operation}' or missing 'where'` };
        }

        return { output: result };
    } catch (err: unknown) {
        return { error: err instanceof Error ? err.message : String(err) };
    }
}

// ── TRANSFORM — Variable Mapping ──────────────────────────────────────────────
function executeTransform(step: WorkflowStep, context: ExecutionContext): StepResult {
    const { mappings } = step.config as { mappings?: Array<{ from: string; to: string; transform?: string }> };

    if (!mappings) return { output: {} };

    const output: Record<string, unknown> = {};
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

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function evaluateCondition(condition: FilterCondition, vars: Record<string, unknown>): boolean {
    const actual = getNestedValue(vars, condition.field);

    switch (condition.operator) {
        case "eq":          return actual === condition.value;
        case "neq":         return actual !== condition.value;
        case "gt":          return (actual as number) > (condition.value as number);
        case "lt":          return (actual as number) < (condition.value as number);
        case "gte":         return (actual as number) >= (condition.value as number);
        case "lte":         return (actual as number) <= (condition.value as number);
        case "contains":    return typeof actual === "string" && actual.includes(String(condition.value));
        case "regex":       return typeof actual === "string" && new RegExp(String(condition.value)).test(actual);
        case "exists":      return actual !== undefined && actual !== null;
        case "not_exists":  return actual === undefined || actual === null;
        default:            return false;
    }
}

function interpolate(template: string, vars: Record<string, unknown>): string {
    return template.replace(/\{\{([^}]+)\}\}/g, (_, key) => {
        const value = getNestedValue(vars, key.trim());
        return value !== undefined && value !== null ? String(value) : "";
    });
}

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    return path.split(".").reduce<unknown>((acc, key) => {
        if (acc && typeof acc === "object") return (acc as Record<string, unknown>)[key];
        return undefined;
    }, obj);
}

function setNestedValue(obj: Record<string, unknown>, path: string, value: unknown): void {
    const keys = path.split(".");
    let current: Record<string, unknown> = obj;
    for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]] || typeof current[keys[i]] !== "object") {
            current[keys[i]] = {};
        }
        current = current[keys[i]] as Record<string, unknown>;
    }
    current[keys[keys.length - 1]] = value;
}

function getNextStepAfterCurrent(steps: WorkflowStep[], currentIndex: number): string | undefined {
    if (currentIndex + 1 < steps.length) {
        return steps[currentIndex + 1].id;
    }
    return undefined;
}

async function markExecution(
    executionId: string,
    status: "SUCCESS" | "FAILED" | "WAITING",
    context: ExecutionContext,
    errorMsg?: string
): Promise<void> {
    await prisma.workflowExecution.update({
        where: { id: executionId },
        data: {
            status,
            completedAt: status !== "WAITING" ? new Date() : undefined,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            contextSnapshot: context as any,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            logs: context.stepHistory as any,
        },
    });

    if (errorMsg) {
        console.error(`[WorkflowExecutor] Execution ${executionId} FAILED: ${errorMsg}`);
    } else {
        console.log(`[WorkflowExecutor] Execution ${executionId} → ${status}`);
    }
}
