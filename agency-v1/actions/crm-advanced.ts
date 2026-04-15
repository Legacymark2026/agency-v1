"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

async function getSession() {
    const session = await auth();
    return session;
}

// ─── TASKS ────────────────────────────────────────────────────────────────────

export async function getTasks(companyId: string, filters?: { completed?: boolean; dealId?: string; assignedTo?: string }) {
    try {
        return await prisma.task.findMany({
            where: {
                companyId,
                ...(filters?.completed !== undefined && { completed: filters.completed }),
                ...(filters?.dealId && { dealId: filters.dealId }),
                ...(filters?.assignedTo && { assignedTo: filters.assignedTo }),
            },
            orderBy: [{ completed: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
            include: {
                assignee: { select: { id: true, name: true, image: true } },
                creator: { select: { id: true, name: true } },
            },
        });
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
        const task = await prisma.task.create({
            data: {
                title: data.title,
                description: data.description,
                dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
                priority: data.priority ?? "MEDIUM",
                dealId: data.dealId,
                leadId: data.leadId,
                assignedTo: data.assignedTo,
                companyId: data.companyId,
                createdBy,
            },
        });
        revalidatePath("/dashboard/admin/crm/tasks");
        return { success: true, id: task.id };
    } catch (error) {
        console.error(error);
        return { error: "Failed to create task" };
    }
}

export async function toggleTask(id: string) {
    try {
        const task = await prisma.task.findUnique({ where: { id }, select: { completed: true } });
        if (!task) return { error: "Not found" };
        await prisma.task.update({
            where: { id },
            data: { completed: !task.completed, completedAt: !task.completed ? new Date() : null, updatedAt: new Date() },
        });
        revalidatePath("/dashboard/admin/crm/tasks");
        return { success: true };
    } catch (error) {
        console.error(error);
        return { error: "Failed to toggle task" };
    }
}

export async function deleteTask(id: string) {
    try {
        await prisma.task.delete({ where: { id } });
        revalidatePath("/dashboard/admin/crm/tasks");
        return { success: true };
    } catch (error) {
        return { error: "Failed to delete task" };
    }
}

export async function updateTask(id: string, data: Record<string, unknown>) {
    try {
        await prisma.task.update({ where: { id }, data: { ...data, updatedAt: new Date() } });
        revalidatePath("/dashboard/admin/crm/tasks");
        return { success: true };
    } catch (error) {
        return { error: "Failed to update task" };
    }
}

// ─── EMAIL TEMPLATES ──────────────────────────────────────────────────────────

export async function getEmailTemplates(companyId: string) {
    try {
        return await prisma.emailTemplate.findMany({
            where: { companyId },
            orderBy: [{ category: "asc" }, { name: "asc" }],
        });
    } catch {
        return [];
    }
}

export async function createEmailTemplate(data: {
    name: string; subject: string; body: string;
    description?: string; category?: string; variables?: string[]; companyId: string;
}) {
    try {
        const tpl = await prisma.emailTemplate.create({
            data: {
                name: data.name, subject: data.subject, body: data.body,
                description: data.description, category: data.category ?? "GENERAL",
                variables: data.variables ?? [],
                companyId: data.companyId,
            },
        });
        revalidatePath("/dashboard/admin/crm/templates");
        return { success: true, id: tpl.id };
    } catch (error) {
        console.error(error);
        return { error: "Failed to create template" };
    }
}

export async function updateEmailTemplate(id: string, data: Record<string, unknown>) {
    try {
        await prisma.emailTemplate.update({ where: { id }, data: { ...data, updatedAt: new Date() } });
        revalidatePath("/dashboard/admin/crm/templates");
        return { success: true };
    } catch {
        return { error: "Failed to update template" };
    }
}

export async function deleteEmailTemplate(id: string) {
    try {
        await prisma.emailTemplate.delete({ where: { id } });
        revalidatePath("/dashboard/admin/crm/templates");
        return { success: true };
    } catch {
        return { error: "Failed to delete template" };
    }
}

// ─── LEAD SCORING RULES ───────────────────────────────────────────────────────

export async function getScoringRules(companyId: string) {
    try {
        return await prisma.leadScoringRule.findMany({
            where: { companyId },
            orderBy: { createdAt: "asc" },
        });
    } catch {
        return [];
    }
}

export async function createScoringRule(data: {
    name: string; field: string; operator: string; value?: string; points: number; companyId: string;
}) {
    try {
        const rule = await prisma.leadScoringRule.create({ data });
        revalidatePath("/dashboard/admin/crm/scoring");
        return { success: true, id: rule.id };
    } catch (error) {
        console.error(error);
        return { error: "Failed to create rule" };
    }
}

export async function deleteScoringRule(id: string) {
    try {
        await prisma.leadScoringRule.delete({ where: { id } });
        revalidatePath("/dashboard/admin/crm/scoring");
        return { success: true };
    } catch {
        return { error: "Failed to delete rule" };
    }
}

export async function toggleScoringRule(id: string) {
    try {
        const rule = await prisma.leadScoringRule.findUnique({ where: { id }, select: { active: true } });
        await prisma.leadScoringRule.update({ where: { id }, data: { active: !rule?.active } });
        revalidatePath("/dashboard/admin/crm/scoring");
        return { success: true };
    } catch {
        return { error: "Failed to toggle rule" };
    }
}

// Core scoring engine — apply rules to a lead and return computed score
export async function computeLeadScore(lead: Record<string, unknown>, companyId: string): Promise<number> {
    try {
        const rules = await prisma.leadScoringRule.findMany({ where: { companyId, active: true } });
        let score = 0;
        for (const rule of rules) {
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
        const leads = await prisma.lead.findMany({
            where: { companyId },
            include: { marketingEvents: true }
        });
        let updated = 0;
        for (const lead of leads) {
            const enrichedLead = enrichLeadWithEvents(lead);
            const score = await computeLeadScore(enrichedLead as unknown as Record<string, unknown>, companyId);
            await prisma.lead.update({ where: { id: lead.id }, data: { score } });
            updated++;
        }
        revalidatePath("/dashboard/admin/crm/leads");
        return { success: true, updated };
    } catch (error) {
        console.error("Failed to recalculate all scores:", error);
        return { error: "Failed to recalculate" };
    }
}

export async function recalculateLeadScore(leadId: string, companyId: string) {
    try {
        const lead = await prisma.lead.findUnique({
            where: { id: leadId, companyId },
            include: { marketingEvents: true }
        });
        if (!lead) return { error: "Lead not found" };

        const enrichedLead = enrichLeadWithEvents(lead);
        const score = await computeLeadScore(enrichedLead as unknown as Record<string, unknown>, companyId);

        await prisma.lead.update({ where: { id: leadId }, data: { score } });

        revalidatePath(`/dashboard/admin/crm/leads/${leadId}`);
        revalidatePath("/dashboard/admin/crm/leads");
        return { success: true, score };
    } catch (error) {
        console.error("Failed to recalculate lead score:", error);
        return { error: "Failed to recalculate" };
    }
}

function enrichLeadWithEvents(lead: any) {
    const events = lead.marketingEvents || [];

    // Aggregations matching the UI field rules
    const aggregatedEvents = {
        website_visits: events.filter((e: any) => e.eventType === 'PAGE_VIEW').length,
        email_opens: events.filter((e: any) => e.eventType === 'EMAIL_OPEN').length,
        downloads: events.filter((e: any) => e.eventType === 'DOWNLOAD' || (e.eventName && e.eventName.toLowerCase().includes('descarga'))).length,
        webinars: events.filter((e: any) => e.eventType === 'WEBINAR' || (e.eventName && e.eventName.toLowerCase().includes('webinar'))).length,
        quote_requests: events.filter((e: any) => e.eventType === 'FORM_SUBMIT' && e.eventName && (e.eventName.toLowerCase().includes('cotiza') || e.eventName.toLowerCase().includes('presupuesto'))).length,
        demos: events.filter((e: any) => e.eventType === 'FORM_SUBMIT' && e.eventName && e.eventName.toLowerCase().includes('demo')).length,
        pricing_visits: events.filter((e: any) => e.eventType === 'PAGE_VIEW' && e.url && e.url.toLowerCase().includes('precio')).length,
    };

    return {
        ...lead,
        events: aggregatedEvents
    };
}

// ─── DEAL DETAIL ─────────────────────────────────────────────────────────────

export async function getDealById(id: string) {
    try {
        const deal = await prisma.deal.findUnique({
            where: { id },
            include: {
                activities: {
                    orderBy: { createdAt: "desc" },
                    include: { user: { select: { name: true, image: true } } },
                },
                assignedUser: { select: { id: true, name: true, image: true, email: true } },
                company: { select: { id: true, name: true } },
            },
        });
        if (!deal) return { error: "Deal not found" };
        return { deal };
    } catch (error) {
        console.error(error);
        return { error: "Failed to fetch deal" };
    }
}

// ─── CRM REPORTS ─────────────────────────────────────────────────────────────

export async function getCRMReports(companyId: string) {
    try {
        const now = new Date();
        const months = Array.from({ length: 6 }, (_, i) => {
            const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
            return { start: new Date(d.getFullYear(), d.getMonth(), 1), end: new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59), label: d.toLocaleString("es", { month: "short" }) };
        });

        const [wonDeals, lostDeals, allLeads, allDeals, sourceStats] = await Promise.all([
            prisma.deal.findMany({ where: { companyId, stage: "WON" }, select: { value: true, createdAt: true, updatedAt: true } }),
            prisma.deal.findMany({ where: { companyId, stage: "LOST" }, select: { value: true, createdAt: true } }),
            prisma.lead.findMany({ where: { companyId }, select: { source: true, status: true, score: true, createdAt: true } }),
            prisma.deal.findMany({ where: { companyId }, select: { id: true, value: true, stage: true, source: true, createdAt: true, assignedUser: { select: { name: true } } } }),
            prisma.lead.groupBy({ by: ["source"], where: { companyId }, _count: { source: true }, orderBy: { _count: { source: "desc" } } }),
        ]);

        // Revenue by month
        const revenueByMonth = months.map((m) => ({
            month: m.label,
            revenue: wonDeals.filter((d) => d.updatedAt >= m.start && d.updatedAt <= m.end).reduce((a, d) => a + d.value, 0),
            leads: allLeads.filter((l) => l.createdAt >= m.start && l.createdAt <= m.end).length,
        }));

        // Win rate trend by month
        const winRateByMonth = months.map((m) => {
            const won = wonDeals.filter((d) => d.updatedAt >= m.start && d.updatedAt <= m.end).length;
            const lost = lostDeals.filter((d) => d.createdAt >= m.start && d.createdAt <= m.end).length;
            const total = won + lost;
            return { month: m.label, winRate: total > 0 ? Math.round((won / total) * 100) : 0 };
        });

        // Lead-to-deal conversion by source
        const conversionBySource = sourceStats.slice(0, 6).map((s) => {
            const converted = allLeads.filter((l) => l.source === s.source && l.status === "CONVERTED").length;
            const total = s._count.source;
            return { source: s.source, total, converted, rate: total > 0 ? Math.round((converted / total) * 100) : 0 };
        });

        // Revenue by stage
        const stageRevenue: Record<string, number> = {};
        allDeals.forEach((d) => { stageRevenue[d.stage] = (stageRevenue[d.stage] ?? 0) + d.value; });

        // Sales rep leaderboard
        const repMap: Record<string, { name: string; won: number; value: number }> = {};
        allDeals.filter((d) => d.stage === "WON").forEach((d) => {
            const name = d.assignedUser?.name ?? "Sin asignar";
            repMap[name] = { name, won: (repMap[name]?.won ?? 0) + 1, value: (repMap[name]?.value ?? 0) + d.value };
        });
        const salesReps = Object.values(repMap).sort((a, b) => b.value - a.value).slice(0, 5);

        // Avg time to close (days)
        const closedDeals = wonDeals.filter((d) => d.createdAt && d.updatedAt);
        const avgDaysToClose = closedDeals.length > 0
            ? Math.round(closedDeals.reduce((a, d) => a + (d.updatedAt.getTime() - d.createdAt.getTime()) / 86400000, 0) / closedDeals.length)
            : 0;

        const totalRevenue = wonDeals.reduce((a, d) => a + d.value, 0);
        const totalLeads = allLeads.length;
        const totalDeals = allDeals.length;
        const winRate = wonDeals.length + lostDeals.length > 0
            ? Math.round((wonDeals.length / (wonDeals.length + lostDeals.length)) * 100)
            : 0;

        return { revenueByMonth, winRateByMonth, conversionBySource, stageRevenue, salesReps, avgDaysToClose, totalRevenue, totalLeads, totalDeals, winRate };
    } catch (error) {
        console.error(error);
        return { error: "Failed to generate reports" };
    }
}
