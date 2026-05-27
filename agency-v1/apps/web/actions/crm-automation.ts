"use server";

import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { DealAutomationRule, AutomationLog } from "@prisma/client";

export type AutomationRuleWithLogs = DealAutomationRule & {
    logs: AutomationLog[];
};

const GATEWAY_URL = process.env.API_GATEWAY_URL || "http://localhost:8080";

async function getSession() {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");
    return session;
}

// ─── TIPOS ────────────────────────────────────────────────────────────────────
export type TriggerType = "STAGE_STUCK_X_DAYS" | "DEAL_CREATED" | "STAGE_CHANGED" | "WON" | "LOST";
export type ActionType = "NOTIFY_ASSIGNEE" | "NOTIFY_ADMIN" | "CHANGE_PRIORITY" | "MOVE_STAGE" | "ADD_TAG" | "SEND_WEBHOOK";

// ─── CRUD REGLAS ──────────────────────────────────────────────────────────────

export async function createAutomationRule(data: {
    companyId: string;
    name: string;
    description?: string;
    triggerType: TriggerType;
    triggerStage?: string;
    triggerDays?: number;
    actionType: ActionType;
    actionPayload: Record<string, unknown>;
}) {
    await getSession();
    const response = await fetch(`${GATEWAY_URL}/api/crm/automation/rules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    const resData = await response.json();
    if (!response.ok) throw new Error(resData.error || "Failed to create rule");
    revalidatePath("/dashboard/admin/crm/automation");
    return { success: true, data: resData.data };
}

export async function updateAutomationRule(id: string, data: Partial<{
    name: string; description: string; isActive: boolean;
    triggerType: string; triggerStage: string; triggerDays: number;
    actionType: string; actionPayload: Record<string, unknown>;
}>) {
    await getSession();
    const response = await fetch(`${GATEWAY_URL}/api/crm/automation/rules/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    const resData = await response.json();
    if (!response.ok) throw new Error(resData.error || "Failed to update rule");
    revalidatePath("/dashboard/admin/crm/automation");
    return { success: true, data: resData.data };
}

export async function deleteAutomationRule(id: string) {
    await getSession();
    const response = await fetch(`${GATEWAY_URL}/api/crm/automation/rules/${id}`, {
        method: 'DELETE'
    });
    const resData = await response.json();
    if (!response.ok) throw new Error(resData.error || "Failed to delete rule");
    revalidatePath("/dashboard/admin/crm/automation");
    return { success: true };
}

export async function listAutomationRules(companyId: string): Promise<AutomationRuleWithLogs[]> {
    const response = await fetch(`${GATEWAY_URL}/api/crm/automation/rules?companyId=${companyId}`);
    const resData = await response.json();
    if (!response.ok) throw new Error(resData.error || "Failed to list rules");
    return (resData.data || []).map((rule: any) => ({
        ...rule,
        createdAt: new Date(rule.createdAt),
        updatedAt: new Date(rule.updatedAt),
        lastRunAt: rule.lastRunAt ? new Date(rule.lastRunAt) : null,
        logs: (rule.logs || []).map((l: any) => ({
            ...l,
            createdAt: new Date(l.createdAt),
        }))
    })) as AutomationRuleWithLogs[];
}

// ─── MOTOR DE EJECUCIÓN ───────────────────────────────────────────────────────

/**
 * Ejecutar todas las reglas activas de una empresa.
 * Llamado desde el cron endpoint /api/crm/run-automation (cada hora).
 */
export async function runAutomationEngine(companyId: string) {
    try {
        const rulesRes = await fetch(`${GATEWAY_URL}/api/crm/automation/rules?companyId=${companyId}`);
        const rulesData = await rulesRes.json();
        if (!rulesRes.ok) throw new Error(rulesData.error || "Failed to fetch rules");
        const rules = rulesData.data || [];
        const activeRules = rules.filter((r: any) => r.isActive);

        const results: { ruleId: string; name: string; dealsAffected: number; errors: number }[] = [];

        for (const rule of activeRules) {
            let dealsAffected = 0;
            let errors = 0;

            try {
                if (rule.triggerType === "STAGE_STUCK_X_DAYS" && rule.triggerStage && rule.triggerDays) {
                    const cutoff = new Date();
                    cutoff.setDate(cutoff.getDate() - rule.triggerDays);

                    const stagnantRes = await fetch(`${GATEWAY_URL}/api/crm/automation/stagnant-deals?companyId=${companyId}&triggerStage=${rule.triggerStage}&cutoffDate=${cutoff.toISOString()}`);
                    const stagnantData = await stagnantRes.json();
                    if (!stagnantRes.ok) throw new Error(stagnantData.error || "Failed to fetch stagnant deals");
                    const stagnantDeals = stagnantData.data || [];

                    for (const deal of stagnantDeals) {
                        try {
                            await executeAction(rule.actionType as ActionType, rule.actionPayload as any, deal);
                            await fetch(`${GATEWAY_URL}/api/crm/automation/logs`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    ruleId: rule.id,
                                    dealId: deal.id,
                                    result: "SUCCESS",
                                    message: `Acción ${rule.actionType} ejecutada`
                                })
                            });
                            dealsAffected++;
                        } catch (e) {
                            await fetch(`${GATEWAY_URL}/api/crm/automation/logs`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    ruleId: rule.id,
                                    dealId: deal.id,
                                    result: "ERROR",
                                    message: String(e)
                                })
                            });
                            errors++;
                        }
                    }
                }

                // Update rule count and lastRunAt
                await fetch(`${GATEWAY_URL}/api/crm/automation/rules/${rule.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        lastRunAt: new Date(),
                        executionCount: (rule.executionCount || 0) + 1
                    })
                });
            } catch (e) {
                errors++;
            }

            results.push({ ruleId: rule.id, name: rule.name, dealsAffected, errors });
        }

        return { success: true, results };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

/** Ejecutar una acción sobre un deal */
async function executeAction(actionType: ActionType, payload: {
    message?: string; stage?: string; priority?: string; tag?: string; webhookUrl?: string;
}, deal: any) {
    switch (actionType) {
        case "CHANGE_PRIORITY":
            if (payload.priority) {
                await fetch(`${GATEWAY_URL}/api/deals/${deal.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ priority: payload.priority })
                });
            }
            break;

        case "MOVE_STAGE":
            if (payload.stage) {
                await fetch(`${GATEWAY_URL}/api/deals/${deal.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ stage: payload.stage })
                });
            }
            break;

        case "ADD_TAG":
            if (payload.tag) {
                const currentTags: string[] = deal.tags ?? [];
                if (!currentTags.includes(payload.tag)) {
                    await fetch(`${GATEWAY_URL}/api/deals/${deal.id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ tags: [...currentTags, payload.tag] })
                    });
                }
            }
            break;

        case "NOTIFY_ASSIGNEE":
        case "NOTIFY_ADMIN": {
            const assignedUser = deal.assignedUser;
            const recipientEmail = assignedUser?.email;
            const message = payload.message ?? `El deal "${deal.title}" (${deal.stage}) requiere tu atención. Lleva más de ${deal.stagnantDays ?? 'X'} días sin actividad.`;

            // 1. Send real email if recipient has an email
            if (recipientEmail) {
                const { sendEmail } = await import("@/lib/email");
                await sendEmail({
                    to: recipientEmail,
                    subject: `⚠️ Alerta CRM: Deal "${deal.title}" requiere acción`,
                    html: `
                        <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
                            <h2 style="color:#0f172a;margin-bottom:8px;">⚠️ Alerta de Automatización</h2>
                            <p style="color:#475569;">${message}</p>
                            <table style="width:100%;border-collapse:collapse;margin:16px 0;">
                                <tr><td style="padding:8px;background:#f8fafc;font-weight:600;">Deal</td><td style="padding:8px;">${deal.title}</td></tr>
                                <tr><td style="padding:8px;background:#f8fafc;font-weight:600;">Etapa</td><td style="padding:8px;">${deal.stage}</td></tr>
                                <tr><td style="padding:8px;background:#f8fafc;font-weight:600;">Valor</td><td style="padding:8px;">$${deal.value ?? 0}</td></tr>
                            </table>
                            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/crm" style="background:#0ea5e9;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block;">Ver en CRM →</a>
                        </div>
                    `,
                    companyId: deal.companyId,
                });
            }

            // 2. In-app notification
            const notifyUserId = deal.assignedTo;
            if (notifyUserId) {
                await fetch(`${GATEWAY_URL}/api/crm/notifications`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: notifyUserId,
                        companyId: deal.companyId,
                        title: `⚠️ Alerta: Deal "${deal.title}"`,
                        message,
                        type: "AUTOMATION_ALERT",
                    })
                }).catch(() => {});
            }

            // 3. CRM activity log
            if (deal.assignedTo) {
                await fetch(`${GATEWAY_URL}/api/deals/${deal.id}/activities`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: deal.assignedTo,
                        type: "AUTOMATION_ALERT",
                        content: message,
                    })
                }).catch(() => {});
            }
            break;
        }

        case "SEND_WEBHOOK":
            if (payload.webhookUrl) {
                await fetch(payload.webhookUrl, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ dealId: deal.id, dealTitle: deal.title, stage: deal.stage, value: deal.value }),
                });
            }
            break;
    }
}

export async function getAutomationLogs(ruleId: string, take = 50) {
    try {
        const response = await fetch(`${GATEWAY_URL}/api/crm/automation/rules/${ruleId}/logs?take=${take}`);
        const resData = await response.json();
        if (!response.ok) throw new Error(resData.error || "Failed to fetch logs");
        return (resData.data || []).map((l: any) => ({
            ...l,
            createdAt: new Date(l.createdAt)
        }));
    } catch (error) {
        console.error(error);
        return [];
    }
}
