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
export type StepType = "ACTION" | "BRANCH" | "WAIT" | "NOTIFY" | "WEBHOOK" | "AI_AGENT" | "DB_WRITE" | "TRANSFORM";
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
    compensate?: {
        type: StepType;
        config: Record<string, unknown>;
    };
}
export interface ExecutionContext {
    workflowId: string;
    executionId: string;
    companyId: string;
    triggerData: Record<string, unknown>;
    variables: Record<string, unknown>;
    stepHistory: Array<{
        stepId: string;
        result: unknown;
        executedAt: string;
    }>;
}
export declare function runWorkflow(workflowId: string, triggerData: Record<string, unknown>): Promise<{
    success: boolean;
    executionId?: string;
    error?: string;
}>;
export declare function resumeWorkflow(executionId: string, resumeData?: Record<string, unknown>): Promise<{
    success: boolean;
    error?: string;
}>;
