"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export type SmartRule = {
    id: string;
    metric: "CPA" | "SPEND" | "CTR" | "ROAS" | "IMPRESSIONS";
    operator: "gt" | "lt" | "gte" | "lte";
    threshold: number;
    window: 1 | 3 | 7; // Días de evaluación
    action: "PAUSE" | "ALERT" | "INCREASE_BUDGET" | "DECREASE_BUDGET";
    actionValue?: number; // Para ajustes de presupuesto
    isActive: boolean;
    label?: string;
};

/**
 * Lee las Smart Rules desde el modelo `CampaignRule` de la BD.
 */
export async function getSmartRules(campaignId: string): Promise<SmartRule[]> {
    try {
        const rules = await prisma.campaignRule.findMany({
            where: { campaignId },
            orderBy: { createdAt: 'asc' }
        });
        
        return rules.map(r => ({
            id: r.id,
            metric: r.conditionKey as SmartRule["metric"],
            operator: r.operator as SmartRule["operator"],
            threshold: r.threshold,
            window: 1, // window was not in the schema, defaulting to 1
            action: r.actionType as SmartRule["action"],
            actionValue: r.actionValue ? parseFloat(r.actionValue) : undefined,
            isActive: r.isActive,
            label: r.name,
        }));
    } catch (e) {
        console.error("Error getting smart rules:", e);
        return [];
    }
}

/**
 * Guarda un nuevo conjunto de Smart Rules para una campaña en la DB.
 * Borra las anteriores y las reemplaza.
 */
export async function saveSmartRules(campaignId: string, rules: SmartRule[]) {
    try {
        const campaign = await prisma.campaign.findUnique({
            where: { id: campaignId },
            select: { companyId: true }
        });

        if (!campaign) throw new Error("Campaña no encontrada");

        // Transaction to delete existing rules and insert the new ones
        await prisma.$transaction(async (tx) => {
            await tx.campaignRule.deleteMany({
                where: { campaignId }
            });

            if (rules.length > 0) {
                await tx.campaignRule.createMany({
                    data: rules.map(rule => ({
                        campaignId,
                        companyId: campaign.companyId,
                        name: rule.label || `Regla de ${rule.metric}`,
                        conditionKey: rule.metric,
                        operator: rule.operator,
                        threshold: rule.threshold,
                        actionType: rule.action,
                        actionValue: rule.actionValue ? rule.actionValue.toString() : null,
                        isActive: rule.isActive
                    }))
                });
            }
        });

        revalidatePath('/dashboard/admin/marketing/campaigns');
        return { success: true };
    } catch (error) {
        console.error("Error saving smart rules:", error);
        return { success: false, error: "No se pudo guardar las reglas." };
    }
}

/**
 * Evalúa las rules de TODAS las campañas activas y ejecuta acciones.
 */
export async function evaluateSmartRules(companyId: string) {
    try {
        const campaigns = await prisma.campaign.findMany({
            where: { companyId, status: "ACTIVE" },
            include: { rules: true }
        });

        const actions: { campaignId: string; ruleObj: any; triggered: boolean }[] = [];

        for (const campaign of campaigns) {
            for (const rule of campaign.rules.filter(r => r.isActive)) {
                // Calcular CPA en tiempo real basado en el acumulado
                const cpa = campaign.conversions > 0 ? campaign.spend / campaign.conversions : 0;
                const ctr = campaign.impressions > 0 ? (campaign.clicks / campaign.impressions) * 100 : 0;

                let metricValue = 0;
                switch (rule.conditionKey) {
                    case "CPA": metricValue = cpa; break;
                    case "SPEND": metricValue = campaign.spend; break;
                    case "CTR": metricValue = ctr; break;
                    case "ROAS":
                        metricValue = 0;
                        break;
                    case "IMPRESSIONS": metricValue = campaign.impressions; break;
                }

                let triggered = false;
                switch (rule.operator) {
                    case "gt": triggered = metricValue > rule.threshold; break;
                    case "lt": triggered = metricValue < rule.threshold; break;
                    case "gte": triggered = metricValue >= rule.threshold; break;
                    case "lte": triggered = metricValue <= rule.threshold; break;
                }

                if (triggered) {
                    if (rule.actionType === "PAUSE") {
                        await prisma.campaign.update({
                            where: { id: campaign.id },
                            data: { status: "PAUSED" }
                        });
                    } else if (rule.actionType === "INCREASE_BUDGET" && campaign.budget && rule.actionValue) {
                        const increase = campaign.budget * (parseFloat(rule.actionValue) / 100);
                        await prisma.campaign.update({
                            where: { id: campaign.id },
                            data: { budget: campaign.budget + increase }
                        });
                    }
                    
                    // Register action executed (for now, just memory array)
                    actions.push({ campaignId: campaign.id, ruleObj: rule, triggered });
                }
            }
        }

        revalidatePath('/dashboard/admin/marketing/campaigns');
        return { success: true, evaluated: actions.length };
    } catch (error) {
        console.error("Error evaluating smart rules:", error);
        return { success: false, error: "Error al evaluar las reglas." };
    }
}
