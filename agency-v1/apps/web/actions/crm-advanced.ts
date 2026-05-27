"use server";

import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { Task } from "@prisma/client";

const GATEWAY_URL = process.env.API_GATEWAY_URL || "http://localhost:8080";

async function getSession() {
    const session = await auth();
    return session;
}

// ─── TASKS ────────────────────────────────────────────────────────────────────

export async function getTasks(companyId: string, filters?: { completed?: boolean; dealId?: string; assignedTo?: string }): Promise<Task[]> {
    try {
        const queryParams = new URLSearchParams({
            companyId,
            ...(filters?.completed !== undefined && { completed: String(filters.completed) }),
            ...(filters?.dealId && { dealId: filters.dealId }),
            ...(filters?.assignedTo && { assignedTo: filters.assignedTo }),
        });
        const response = await fetch(`${GATEWAY_URL}/api/crm/tasks?${queryParams.toString()}`);
        const resData = await response.json();
        if (!response.ok) throw new Error(resData.error || "Failed to fetch tasks");
        return ((resData.data || []).map((task: any) => ({
            ...task,
            dueDate: task.dueDate ? new Date(task.dueDate) : null,
            createdAt: new Date(task.createdAt),
            updatedAt: new Date(task.updatedAt),
            completedAt: task.completedAt ? new Date(task.completedAt) : null,
        }))) as Task[];
    } catch (error) {
        console.error(error);
        return [];
    }
}

export async function createTask(data: {
    title: string; description?: string; dueDate?: string; priority?: string;
    dealId?: string; leadId?: string; assignedTo?: string; companyId: string;
}) {
    const session = await getSession();
    const createdBy = session?.user?.id ?? "system";
    try {
        const response = await fetch(`${GATEWAY_URL}/api/crm/tasks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...data, createdBy })
        });
        const resData = await response.json();
        if (!response.ok) return { error: resData.error || "Failed to create task" };
        revalidatePath("/dashboard/admin/crm/tasks");
        return { success: true, id: resData.data.id };
    } catch (error) {
        console.error(error);
        return { error: "Failed to create task" };
    }
}

export async function toggleTask(id: string) {
    try {
        const getRes = await fetch(`${GATEWAY_URL}/api/crm/tasks/${id}`);
        const getData = await getRes.json();
        if (!getRes.ok) return { error: getData.error || "Not found" };
        const task = getData.data;

        const patchRes = await fetch(`${GATEWAY_URL}/api/crm/tasks/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                completed: !task.completed,
                completedAt: !task.completed ? new Date() : null
            })
        });
        const patchData = await patchRes.json();
        if (!patchRes.ok) return { error: patchData.error || "Failed to toggle task" };

        revalidatePath("/dashboard/admin/crm/tasks");
        return { success: true };
    } catch (error) {
        console.error(error);
        return { error: "Failed to toggle task" };
    }
}

export async function deleteTask(id: string) {
    try {
        const response = await fetch(`${GATEWAY_URL}/api/crm/tasks/${id}`, {
            method: 'DELETE'
        });
        const resData = await response.json();
        if (!response.ok) return { error: resData.error || "Failed to delete task" };
        revalidatePath("/dashboard/admin/crm/tasks");
        return { success: true };
    } catch (error) {
        return { error: "Failed to delete task" };
    }
}

export async function updateTask(id: string, data: Record<string, unknown>) {
    try {
        const response = await fetch(`${GATEWAY_URL}/api/crm/tasks/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const resData = await response.json();
        if (!response.ok) return { error: resData.error || "Failed to update task" };
        revalidatePath("/dashboard/admin/crm/tasks");
        return { success: true };
    } catch (error) {
        return { error: "Failed to update task" };
    }
}

// ─── EMAIL TEMPLATES ──────────────────────────────────────────────────────────

export async function getEmailTemplates(companyId: string) {
    try {
        const response = await fetch(`${GATEWAY_URL}/api/crm/email-templates?companyId=${companyId}`);
        const resData = await response.json();
        if (!response.ok) throw new Error(resData.error || "Failed to fetch templates");
        return (resData.data || []).map((tpl: any) => ({
            ...tpl,
            createdAt: new Date(tpl.createdAt),
            updatedAt: new Date(tpl.updatedAt),
        }));
    } catch {
        return [];
    }
}

export async function createEmailTemplate(data: {
    name: string; subject: string; body: string;
    description?: string; category?: string; variables?: string[]; companyId: string;
}) {
    try {
        const response = await fetch(`${GATEWAY_URL}/api/crm/email-templates`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const resData = await response.json();
        if (!response.ok) return { error: resData.error || "Failed to create template" };
        revalidatePath("/dashboard/admin/crm/templates");
        return { success: true, id: resData.data.id };
    } catch (error) {
        console.error(error);
        return { error: "Failed to create template" };
    }
}

export async function updateEmailTemplate(id: string, data: Record<string, unknown>) {
    try {
        const response = await fetch(`${GATEWAY_URL}/api/crm/email-templates/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const resData = await response.json();
        if (!response.ok) return { error: resData.error || "Failed to update template" };
        revalidatePath("/dashboard/admin/crm/templates");
        return { success: true };
    } catch {
        return { error: "Failed to update template" };
    }
}

export async function deleteEmailTemplate(id: string) {
    try {
        const response = await fetch(`${GATEWAY_URL}/api/crm/email-templates/${id}`, {
            method: 'DELETE'
        });
        const resData = await response.json();
        if (!response.ok) return { error: resData.error || "Failed to delete template" };
        revalidatePath("/dashboard/admin/crm/templates");
        return { success: true };
    } catch {
        return { error: "Failed to delete template" };
    }
}

// ─── LEAD SCORING RULES ───────────────────────────────────────────────────────

export async function getScoringRules(companyId: string) {
    try {
        const response = await fetch(`${GATEWAY_URL}/api/crm/scoring-rules?companyId=${companyId}`);
        const resData = await response.json();
        if (!response.ok) throw new Error(resData.error || "Failed to fetch rules");
        return (resData.data || []).map((rule: any) => ({
            ...rule,
            createdAt: new Date(rule.createdAt),
            updatedAt: new Date(rule.updatedAt),
        }));
    } catch {
        return [];
    }
}

export async function createScoringRule(data: {
    name: string; field: string; operator: string; value?: string; points: number; companyId: string;
}) {
    try {
        const response = await fetch(`${GATEWAY_URL}/api/crm/scoring-rules`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const resData = await response.json();
        if (!response.ok) return { error: resData.error || "Failed to create rule" };
        revalidatePath("/dashboard/admin/crm/scoring");
        return { success: true, id: resData.data.id };
    } catch (error) {
        console.error(error);
        return { error: "Failed to create rule" };
    }
}

export async function deleteScoringRule(id: string) {
    try {
        const response = await fetch(`${GATEWAY_URL}/api/crm/scoring-rules/${id}`, {
            method: 'DELETE'
        });
        const resData = await response.json();
        if (!response.ok) return { error: resData.error || "Failed to delete rule" };
        revalidatePath("/dashboard/admin/crm/scoring");
        return { success: true };
    } catch {
        return { error: "Failed to delete rule" };
    }
}

export async function toggleScoringRule(id: string) {
    try {
        const getRes = await fetch(`${GATEWAY_URL}/api/crm/scoring-rules/${id}`);
        const getData = await getRes.json();
        if (!getRes.ok) return { error: getData.error || "Not found" };
        const rule = getData.data;

        const response = await fetch(`${GATEWAY_URL}/api/crm/scoring-rules/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ active: !rule?.active })
        });
        const resData = await response.json();
        if (!response.ok) return { error: resData.error || "Failed to toggle rule" };
        revalidatePath("/dashboard/admin/crm/scoring");
        return { success: true };
    } catch {
        return { error: "Failed to toggle rule" };
    }
}

// Core scoring engine — apply rules to a lead and return computed score
export async function computeLeadScore(lead: Record<string, unknown>, companyId: string): Promise<number> {
    try {
        const rules = await getScoringRules(companyId);
        const activeRules = rules.filter((r: any) => r.active);
        let score = 0;
        for (const rule of activeRules) {
            const fieldVal = rule.field.includes(".") ? getNestedValue(lead, rule.field) : lead[rule.field];
            const match = evaluateRule(fieldVal, rule.operator, rule.value ?? null);
            if (match) score += rule.points;
        }
        return Math.max(0, Math.min(100, score));
    } catch {
        return 0;
    }
}

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    return path.split(".").reduce((acc: unknown, key: string) => {
        if (acc && typeof acc === "object") return (acc as Record<string, unknown>)[key];
        return undefined;
    }, obj);
}

function evaluateRule(value: unknown, operator: string, ruleValue: string | null): boolean {
    switch (operator) {
        case "exists": return value !== null && value !== undefined && value !== "";
        case "equals": return String(value) === ruleValue;
        case "contains": return typeof value === "string" && value.toLowerCase().includes((ruleValue ?? "").toLowerCase());
        case "greaterThan": return typeof value === "number" && value > Number(ruleValue);
        case "lessThan": return typeof value === "number" && value < Number(ruleValue);
        case "in": return (ruleValue ?? "").split(",").map((s) => s.trim()).includes(String(value));
        default: return false;
    }
}

export async function recalculateAllScores(companyId: string) {
    try {
        const response = await fetch(`${GATEWAY_URL}/api/crm/scoring/recalculate-all`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ companyId })
        });
        const resData = await response.json();
        if (!response.ok) return { error: resData.error || "Failed to recalculate" };
        revalidatePath("/dashboard/admin/crm/leads");
        return { success: true, updated: resData.updated };
    } catch (error) {
        console.error("Failed to recalculate all scores:", error);
        return { error: "Failed to recalculate" };
    }
}

export async function recalculateLeadScore(leadId: string, companyId: string) {
    try {
        const response = await fetch(`${GATEWAY_URL}/api/crm/scoring/recalculate-lead`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ leadId, companyId })
        });
        const resData = await response.json();
        if (!response.ok) return { error: resData.error || "Failed to recalculate" };

        revalidatePath(`/dashboard/admin/crm/leads/${leadId}`);
        revalidatePath("/dashboard/admin/crm/leads");
        return { success: true, score: resData.score };
    } catch (error) {
        console.error("Failed to recalculate lead score:", error);
        return { error: "Failed to recalculate" };
    }
}

// ─── DEAL DETAIL ─────────────────────────────────────────────────────────────

export async function getDealById(id: string) {
    try {
        const response = await fetch(`${GATEWAY_URL}/api/deals/${id}`);
        const resData = await response.json();
        if (!response.ok) return { error: resData.error || "Deal not found" };
        const deal = resData.deal;
        if (deal) {
            if (deal.createdAt) deal.createdAt = new Date(deal.createdAt);
            if (deal.updatedAt) deal.updatedAt = new Date(deal.updatedAt);
            if (deal.expectedClose) deal.expectedClose = new Date(deal.expectedClose);
            if (deal.lastActivity) deal.lastActivity = new Date(deal.lastActivity);
            if (deal.activities) {
                deal.activities = deal.activities.map((act: any) => ({
                    ...act,
                    createdAt: new Date(act.createdAt),
                    updatedAt: new Date(act.updatedAt),
                }));
            }
        }
        return { deal };
    } catch (error) {
        console.error(error);
        return { error: "Failed to fetch deal" };
    }
}

// ─── CRM REPORTS ─────────────────────────────────────────────────────────────

export async function getCRMReports(companyId: string) {
    try {
        const response = await fetch(`${GATEWAY_URL}/api/crm/reports?companyId=${companyId}`);
        const resData = await response.json();
        if (!response.ok) return { error: resData.error || "Failed to generate reports" };
        return resData.data;
    } catch (error) {
        console.error(error);
        return { error: "Failed to generate reports" };
    }
}
