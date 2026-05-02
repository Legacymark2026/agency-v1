"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
export interface WorkflowVersion {
    version: number;
    savedAt: string;         // ISO timestamp
    savedBy?: string;        // user email or "system"
    name: string;
    triggerType: string;
    triggerConfig: any;
    steps: any;
    isActive: boolean;
    changeNote?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/** 
 * Reads the `versions` JSON field from the Workflow record.
 * Falls back to [] if field doesn't exist (pre-migration workflows).
 */
async function readVersions(workflowId: string): Promise<WorkflowVersion[]> {
    const raw = await prisma.$queryRawUnsafe<any[]>(
        `SELECT versions FROM workflows WHERE id = $1`,
        workflowId
    );
    if (!raw || raw.length === 0) return [];
    const versions = raw[0]?.versions;
    if (!versions) return [];
    return Array.isArray(versions) ? versions : JSON.parse(versions as string);
}

/**
 * Writes the `versions` JSON array back to the Workflow record.
 */
async function writeVersions(workflowId: string, versions: WorkflowVersion[]): Promise<void> {
    await prisma.$executeRawUnsafe(
        `UPDATE workflows SET versions = $1::jsonb, updated_at = NOW() WHERE id = $2`,
        JSON.stringify(versions),
        workflowId
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC SERVER ACTIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Saves a version snapshot of the current workflow state.
 * Called automatically before each "Publish & Activate".
 */
export async function saveWorkflowVersion(
    workflowId: string,
    changeNote?: string
): Promise<{ success: boolean; version?: number; error?: string }> {
    try {
        const session = await auth();
        const workflow = await prisma.workflow.findUnique({ where: { id: workflowId } });
        if (!workflow) return { success: false, error: "Workflow not found" };

        const existing = await readVersions(workflowId);
        const nextVersion = (existing.length > 0 ? existing[existing.length - 1].version : 0) + 1;

        const snapshot: WorkflowVersion = {
            version: nextVersion,
            savedAt: new Date().toISOString(),
            savedBy: session?.user?.email || "system",
            name: workflow.name,
            triggerType: workflow.triggerType,
            triggerConfig: workflow.triggerConfig,
            steps: workflow.steps,
            isActive: workflow.isActive,
            changeNote: changeNote || `Versión ${nextVersion}`,
        };

        // Keep max 20 versions (rolling window)
        const updated = [...existing, snapshot].slice(-20);
        await writeVersions(workflowId, updated);

        return { success: true, version: nextVersion };
    } catch (e: any) {
        console.error("[WorkflowVersioning] Save failed:", e);
        return { success: false, error: e.message };
    }
}

/**
 * Returns the full version history for a workflow.
 */
export async function getWorkflowVersions(
    workflowId: string
): Promise<{ success: boolean; versions?: WorkflowVersion[]; error?: string }> {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        const versions = await readVersions(workflowId);
        return { success: true, versions: versions.reverse() }; // Newest first
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

/**
 * Rolls back a workflow to a specific version.
 * Automatically saves the current state as a new version before rolling back.
 */
export async function rollbackWorkflowToVersion(
    workflowId: string,
    targetVersion: number
): Promise<{ success: boolean; error?: string }> {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        const versions = await readVersions(workflowId);
        const target = versions.find((v) => v.version === targetVersion);
        if (!target) return { success: false, error: `Version ${targetVersion} not found` };

        // Save current state as a checkpoint before rollback
        await saveWorkflowVersion(workflowId, `Auto-checkpoint before rollback to v${targetVersion}`);

        // Apply the target version's state
        await prisma.workflow.update({
            where: { id: workflowId },
            data: {
                name: target.name,
                triggerType: target.triggerType,
                triggerConfig: target.triggerConfig as any,
                steps: target.steps as any,
                isActive: target.isActive,
            },
        });

        return { success: true };
    } catch (e: any) {
        console.error("[WorkflowVersioning] Rollback failed:", e);
        return { success: false, error: e.message };
    }
}
