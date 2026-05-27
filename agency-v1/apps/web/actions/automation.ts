"use server";

import { auth } from "@/lib/auth";

const GATEWAY_URL = process.env.API_GATEWAY_URL || "http://localhost:8080";

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

// --- READ / QUERY OPERATIONS ---

export async function getRecentExecutions(companyId: string) {
    try {
        const response = await fetch(`${GATEWAY_URL}/api/automation/executions/recent?companyId=${companyId}`, {
            cache: "no-store",
        });
        const resData = await response.json();
        if (!response.ok) return [];
        return resData.executions;
    } catch (e) {
        console.error("Error in getRecentExecutions:", e);
        return [];
    }
}

export async function getExecutionById(executionId: string) {
    try {
        const response = await fetch(`${GATEWAY_URL}/api/automation/executions/${executionId}`, {
            cache: "no-store",
        });
        const resData = await response.json();
        if (!response.ok) return null;
        return resData.execution;
    } catch (e) {
        console.error("Error in getExecutionById:", e);
        return null;
    }
}

export async function getAutomationAnalytics(companyId: string) {
    try {
        const response = await fetch(`${GATEWAY_URL}/api/automation/analytics?companyId=${companyId}`, {
            cache: "no-store",
        });
        const resData = await response.json();
        if (!response.ok) return null;
        return resData;
    } catch (e) {
        console.error("Failed to get automation analytics:", e);
        return null;
    }
}

// --- CORE ENGINE PROXIES ---

export async function triggerWorkflow(triggerType: string, triggerData: any) {
    try {
        const response = await fetch(`${GATEWAY_URL}/api/workflows/trigger`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ triggerType, triggerData }),
        });
        const resData = await response.json();
        if (!response.ok) return { executed: 0 };
        return resData;
    } catch (error) {
        console.error("Failed to trigger workflow:", error);
        return { executed: 0 };
    }
}

export async function executeWorkflow(workflowId: string, triggerData: any, resumeFromNodeId?: string) {
    try {
        const response = await fetch(`${GATEWAY_URL}/api/workflows/${workflowId}/execute`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ triggerData, resumeFromNodeId }),
        });
        const resData = await response.json();
        return resData;
    } catch (error) {
        console.error("Failed to execute workflow:", error);
        throw error;
    }
}

// --- CRUD OPERATIONS ---

export async function saveUserWorkflow(data: any) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const cuRes = await fetch(`${GATEWAY_URL}/api/crm/users/${session.user.id}/company`);
    const cuData = await cuRes.json();
    if (!cuRes.ok || !cuData.data) return { success: false, error: "No company found" };

    return await saveWorkflow(cuData.data.companyId, data);
}

export async function saveWorkflow(companyId: string, data: any) {
    try {
        const response = await fetch(`${GATEWAY_URL}/api/workflows`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ companyId, data }),
        });
        const resData = await response.json();
        if (!response.ok) return { success: false, error: resData.error || "Failed to save workflow" };
        return { success: true };
    } catch (e: any) {
        console.error("Error in saveWorkflow:", e);
        return { success: false, error: e.message };
    }
}

export async function getLatestWorkflow(companyId?: string) {
    const session = await auth();
    if (!session?.user?.id) return null;

    let resolvedCompanyId = companyId;
    if (!resolvedCompanyId) {
        const cuRes = await fetch(`${GATEWAY_URL}/api/crm/users/${session.user.id}/company`);
        const cuData = await cuRes.json();
        resolvedCompanyId = cuData?.data?.companyId;
    }
    if (!resolvedCompanyId) return null;

    try {
        const response = await fetch(`${GATEWAY_URL}/api/workflows/latest?companyId=${resolvedCompanyId}`, {
            cache: "no-store",
        });
        const resData = await response.json();
        if (!response.ok) return null;
        return resData.workflow;
    } catch (e) {
        console.error("Error in getLatestWorkflow:", e);
        return null;
    }
}

export async function getWorkflowById(id: string) {
    const session = await auth();
    if (!session?.user?.id) return null;

    try {
        const response = await fetch(`${GATEWAY_URL}/api/workflows/${id}`, {
            cache: "no-store",
        });
        const resData = await response.json();
        if (!response.ok) return null;
        return resData.workflow;
    } catch (e) {
        console.error("Error in getWorkflowById:", e);
        return null;
    }
}

export async function getWorkflows(companyId: string) {
    const session = await auth();
    if (!session?.user?.id) return [];

    try {
        const response = await fetch(`${GATEWAY_URL}/api/workflows?companyId=${companyId}`, {
            cache: "no-store",
        });
        const resData = await response.json();
        if (!response.ok) return [];
        return resData.workflows;
    } catch (e) {
        console.error("Error in getWorkflows:", e);
        return [];
    }
}

export async function deleteWorkflow(id: string) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    try {
        const response = await fetch(`${GATEWAY_URL}/api/workflows/${id}`, {
            method: "DELETE",
        });
        const resData = await response.json();
        if (!response.ok) return { success: false, error: resData.error || "Failed to delete workflow" };
        return { success: true };
    } catch (e: any) {
        console.error("Error in deleteWorkflow:", e);
        return { success: false, error: e.message };
    }
}

export async function toggleWorkflow(id: string, isActive: boolean) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    try {
        const response = await fetch(`${GATEWAY_URL}/api/workflows/${id}/toggle`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isActive }),
        });
        const resData = await response.json();
        if (!response.ok) return { success: false, error: resData.error || "Failed to toggle workflow" };
        return { success: true };
    } catch (e: any) {
        console.error("Error in toggleWorkflow:", e);
        return { success: false, error: e.message };
    }
}

export async function bulkDeleteWorkflows(ids: string[]) {
    try {
        const response = await fetch(`${GATEWAY_URL}/api/workflows/bulk-delete`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ids }),
        });
        const resData = await response.json();
        if (!response.ok) return { success: false, error: resData.error || "Failed to bulk delete workflows" };
        return { success: true };
    } catch (e: any) {
        console.error("Error in bulkDeleteWorkflows:", e);
        return { success: false, error: e.message };
    }
}

export async function bulkToggleWorkflows(ids: string[], isActive: boolean) {
    try {
        const response = await fetch(`${GATEWAY_URL}/api/workflows/bulk-toggle`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ids, isActive }),
        });
        const resData = await response.json();
        if (!response.ok) return { success: false, error: resData.error || "Failed to bulk toggle workflows" };
        return { success: true };
    } catch (e: any) {
        console.error("Error in bulkToggleWorkflows:", e);
        return { success: false, error: e.message };
    }
}

export async function getIntegrationsStatusMap() {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    try {
        const cuRes = await fetch(`${GATEWAY_URL}/api/crm/users/${session.user.id}/company`);
        const cuData = await cuRes.json();
        if (!cuRes.ok || !cuData.data) return { success: false, error: "Company not found" };

        const response = await fetch(`${GATEWAY_URL}/api/automation/integrations-status?companyId=${cuData.data.companyId}`, {
            cache: "no-store",
        });
        const resData = await response.json();
        if (!response.ok) return { success: false, error: resData.error || "Failed to get integrations status map" };
        return resData;
    } catch (e: any) {
        console.error("Error in getIntegrationsStatusMap:", e);
        return { success: false, error: e.message };
    }
}
