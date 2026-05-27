/**
 * Workflow Executor Engine — Migrated from apps/web/actions/automation.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Full DAG-based workflow runtime with SAGA rollback, WAIT/RESUME,
 * branching, DB writes, transforms, webhooks, and AI agent invocation.
 */
export declare function triggerWorkflow(triggerType: string, triggerData: any): Promise<{
    executed: number;
    details?: undefined;
} | {
    executed: number;
    details: any[];
}>;
export declare function executeWorkflow(workflowId: string, triggerData: any, resumeFromNodeId?: string): Promise<void>;
