"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { JsonValue } from "@prisma/client/runtime/library";

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
    const rule = await prisma.dealAutomationRule.create({
        data: {
            companyId: data.companyId,
            name: data.name,
            description: data.description,
            triggerType: data.triggerType,
            triggerStage: data.triggerStage,
            triggerDays: data.triggerDays,
            actionType: data.actionType,
            actionPayload: data.actionPayload as unknown as JsonValue,
        },
    });
    revalidatePath("/dashboard/admin/crm/automation");
    return { success: true, data: rule };
}

export async function updateAutomationRule(id: string, data: Partial<{
    name: string; description: string; isActive: boolean;
    triggerType: string; triggerStage: string; triggerDays: number;
    actionType: string; actionPayload: Record<string, unknown>;
}>) {
    await getSession();
    const rule = await prisma.dealAutomationRule.update({ where: { id }, data: data as any });
    revalidatePath("/dashboard/admin/crm/automation");
    return { success: true, data: rule };
}

export async function deleteAutomationRule(id: string) {
    await getSession();
    await prisma.dealAutomationRule.delete({ where: { id } });
    revalidatePath("/dashboard/admin/crm/automation");
    return { success: true };
}

export async function listAutomationRules(companyId: string) {
    return prisma.dealAutomationRule.findMany({
        where: { companyId },
        include: { logs: { orderBy: { createdAt: "desc" }, take: 3 } },
        orderBy: { createdAt: "desc" },
    });
}

// ─── MOTOR DE EJECUCIÓN ───────────────────────────────────────────────────────

/**
 * Ejecutar todas las reglas activas de una empresa.
 * Llamado desde el cron endpoint /api/crm/run-automation (cada hora).
 */
export async function runAutomationEngine(companyId: string) {
    const rules = await prisma.dealAutomationRule.findMany({
        where: { companyId, isActive: true },
    });

    const results: { ruleId: string; name: string; dealsAffected: number; errors: number }[] = [];

    for (const rule of rules) {
        let dealsAffected = 0;
        let errors = 0;

        try {
            if (rule.triggerType === "STAGE_STUCK_X_DAYS" && rule.triggerStage && rule.triggerDays) {
                const cutoff = new Date();
                cutoff.setDate(cutoff.getDate() - rule.triggerDays);

                const stagnantDeals = await prisma.deal.findMany({
                    where: {
                        companyId,
                        stage: rule.triggerStage,
                        lastActivity: { lte: cutoff },
                        stage_not: "WON" as any,
                    } as any,
                    include: { assignedUser: { select: { id: true, email: true, name: true } } },
                });

                for (const deal of stagnantDeals) {
                    try {
                        await executeAction(rule.actionType as ActionType, rule.actionPayload as any, deal);
                        await prisma.automationLog.create({
                            data: { ruleId: rule.id, dealId: deal.id, result: "SUCCESS", message: `Acción ${rule.actionType} ejecutada` },
                        });
                        dealsAffected++;
                    } catch (e) {
                        await prisma.automationLog.create({
                            data: { ruleId: rule.id, dealId: deal.id, result: "ERROR", message: String(e) },
                        });
                        errors++;
                    }
                }
            }

            // Actualizar conteo y lastRunAt
            await prisma.dealAutomationRule.update({
                where: { id: rule.id },
                data: { lastRunAt: new Date(), executionCount: { increment: 1 } },
            });
        } catch (e) {
            errors++;
        }

        results.push({ ruleId: rule.id, name: rule.name, dealsAffected, errors });
    }

    return { success: true, results };
}

/** Ejecutar una acción sobre un deal */
async function executeAction(actionType: ActionType, payload: {
    message?: string; stage?: string; priority?: string; tag?: string; webhookUrl?: string;
}, deal: any) {
    switch (actionType) {
        case "CHANGE_PRIORITY":
            if (payload.priority) {
                await prisma.deal.update({ where: { id: deal.id }, data: { priority: payload.priority } });
            }
            break;

        case "MOVE_STAGE":
            if (payload.stage) {
                await prisma.deal.update({ where: { id: deal.id }, data: { stage: payload.stage, lastActivity: new Date() } });
            }
            break;

        case "ADD_TAG":
            if (payload.tag) {
                const currentTags: string[] = deal.tags ?? [];
                if (!currentTags.includes(payload.tag)) {
                    await prisma.deal.update({ where: { id: deal.id }, data: { tags: [...currentTags, payload.tag] } });
                }
            }
            break;

        case "NOTIFY_ASSIGNEE":
        case "NOTIFY_ADMIN":
            // En un sistema real, aquí se enviaría un email/push notification.
            // Por ahora se crea una actividad CRM como notificación interna.
            if (deal.assignedTo || actionType === "NOTIFY_ADMIN") {
                await prisma.cRMActivity.create({
                    data: {
                        dealId: deal.id,
                        userId: deal.assignedTo ?? deal.id, // fallback
                        type: "AUTOMATION_ALERT",
                        content: payload.message ?? `Alerta automática: El deal "${deal.title}" requiere acción.`,
                    },
                });
            }
            break;

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
    return prisma.automationLog.findMany({
        where: { ruleId },
        orderBy: { createdAt: "desc" },
        take,
    });
}
