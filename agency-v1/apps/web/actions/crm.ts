"use server";

import { prisma } from "@/lib/prisma";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { rateLimit } from "@/lib/rate-limit";
import { sendMetaCapiEvent } from "@/lib/meta-capi";
import { sendTiktokCapiEvent } from "@/lib/tiktok-capi";
import { sendGa4Event } from "@/lib/ga4-mp";
import { sendLinkedinCapiEvent } from "@/lib/linkedin-capi";
import { triggerWorkflow } from "@/actions/automation";
import { getAuthContext, authErrorToResponse } from "@/lib/auth-context";

// ─── AUTH ────────────────────────────────────────────────────────────────────

/**
 * @deprecated Usar getAuthContext() para validación completa con companyId y estado de empresa.
 * Mantenido para compatibilidad con acciones que aún no han sido migradas.
 */
async function checkAuth() {
    const session = await auth();
    if (!session?.user) return { error: "Unauthorized" };
    if (!session.user.companyId) return { error: "No company associated" };
    return null;
}

async function getUserId(): Promise<string> {
    const session = await auth();
    return session?.user?.id ?? "anonymous";
}

export interface TeamNode {
    id: string;
    name: string;
    parentId: string | null;
    children: TeamNode[];
    _count?: { members: number };
}

// ─── CRM DASHBOARD STATS ─────────────────────────────────────────────────────

export async function getCRMStats() {
    const authCheck = await checkAuth();
    if (authCheck) return authCheck;

    try {
        const [pipelineValue, activeDeals, wonDeals, lostDeals] = await Promise.all([
            prisma.deal.aggregate({ _sum: { value: true }, where: { stage: { notIn: ["WON", "LOST"] } } }),
            prisma.deal.count({ where: { stage: { notIn: ["WON", "LOST"] } } }),
            prisma.deal.count({ where: { stage: "WON" } }),
            prisma.deal.count({ where: { stage: "LOST" } }),
        ]);

        const totalClosed = wonDeals + lostDeals;
        const winRate = totalClosed > 0 ? (wonDeals / totalClosed) * 100 : 0;

        const wonValue = await prisma.deal.aggregate({ _sum: { value: true }, where: { stage: "WON" } });
        const avgDealSize = wonDeals > 0 ? (wonValue._sum.value || 0) / wonDeals : 0;

        return {
            pipelineValue: pipelineValue._sum.value || 0,
            activeDeals,
            winRate: Math.round(winRate),
            avgDealSize: Math.round(avgDealSize),
        };
    } catch (error) {
        console.error("Failed to fetch CRM stats:", error);
        return { error: "Failed to load stats" };
    }
}

export async function getSalesFunnel() {
    // 3.4: defense-in-depth — auth check en funciones de lectura
    const authCheck = await checkAuth();
    if (authCheck) return [];
    const stages = ["NEW", "QUALIFIED", "PROPOSAL", "NEGOTIATION", "WON"] as const;
    try {
        const grouped = await prisma.deal.groupBy({
            by: ["stage"],
            _count: { stage: true },
            where: { stage: { in: [...stages] } },
        });
        return stages.map((s) => ({ name: s, value: grouped.find((g) => g.stage === s)?._count.stage ?? 0 }));
    } catch (error) {
        console.error(error);
        return [];
    }
}

export async function getRecentActivity() {
    // 3.4: defense-in-depth — auth check en funciones de lectura
    const authCheck = await checkAuth();
    if (authCheck) return [];
    try {
        const [recentLeads, recentDeals] = await Promise.all([
            prisma.lead.findMany({ orderBy: { createdAt: "desc" }, take: 5, select: { id: true, name: true, status: true, createdAt: true } }),
            prisma.deal.findMany({ orderBy: { updatedAt: "desc" }, take: 5, select: { id: true, title: true, stage: true, updatedAt: true, value: true } }),
        ]);

        return [
            ...recentLeads.map((l) => ({ id: l.id, type: "LEAD", title: `Nuevo lead: ${l.name}`, desc: `Estado: ${l.status}`, date: l.createdAt })),
            ...recentDeals.map((d) => ({ id: d.id, type: "DEAL", title: `Deal actualizado: ${d.title}`, desc: `Etapa: ${d.stage} - $${d.value}`, date: d.updatedAt })),
        ]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 10);
    } catch (error) {
        console.error(error);
        return [];
    }
}

export async function getTopDeals() {
    // 3.4: defense-in-depth — auth check en funciones de lectura
    const authCheck = await checkAuth();
    if (authCheck) return [];
    try {
        return await prisma.deal.findMany({
            where: { stage: { notIn: ["WON", "LOST"] } },
            orderBy: { value: "desc" },
            take: 5,
            select: { id: true, title: true, value: true, stage: true, probability: true, expectedClose: true },
        });
    } catch (error) {
        console.error(error);
        return [];
    }
}

export async function getHighPerformanceStats() {
    const authCheck = await checkAuth();
    if (authCheck) return { error: "Unauthorized" };

    try {
        const today = new Date();
        const thirtyDaysAgo = subDays(today, 30);
        const lastMonthStart = startOfMonth(subDays(today, 30));
        const lastMonthEnd = endOfMonth(subDays(today, 30));

        // 2.3: Definir ventana de forecast UNA sola vez
        const forecastMonths = [
            { start: startOfMonth(today),                   end: endOfMonth(today),                   name: format(today, "MMM") },
            { start: startOfMonth(subDays(today, -30)),     end: endOfMonth(subDays(today, -30)),     name: format(subDays(today, -30), "MMM") },
            { start: startOfMonth(subDays(today, -60)),     end: endOfMonth(subDays(today, -60)),     name: format(subDays(today, -60), "MMM") },
        ];
        const forecastWindowStart = forecastMonths[0].start;
        const forecastWindowEnd   = forecastMonths[forecastMonths.length - 1].end;

        // 2.3: TODAS las queries en un único Promise.all — sin waterfalls
        const [
            wonDealsCount,
            lostDealsCount,
            wonDealsData,
            stagnantDealsCount,
            leadSources,
            lostReasons,
            currentPipeline,
            lastMonthPipeline,
            recentActivitiesCount,
            // 2.3: groupBy en DB → elimina el findMany(user)+assignedDeals (N+1 pattern)
            leaderboardRaw,
            // 2.3: UNA sola query para los 3 meses de forecast en lugar de 3 queries secuenciales
            allForecastDeals,
        ] = await Promise.all([
            prisma.deal.count({ where: { stage: "WON" } }),
            prisma.deal.count({ where: { stage: "LOST" } }),
            // Necesitamos createdAt+updatedAt para calcular avgDaysToClose
            prisma.deal.findMany({
                where: { stage: "WON" },
                select: { createdAt: true, updatedAt: true, value: true },
            }),
            prisma.deal.count({
                where: { stage: { notIn: ["WON", "LOST"] }, updatedAt: { lt: thirtyDaysAgo } },
            }),
            prisma.lead.groupBy({
                by: ["source"],
                _count: { source: true },
                orderBy: { _count: { source: "desc" } },
                take: 5,
            }),
            prisma.deal.groupBy({
                by: ["lostReason"],
                where: { stage: "LOST", lostReason: { not: null } },
                _count: { lostReason: true },
                orderBy: { _count: { lostReason: "desc" } },
            }),
            prisma.deal.aggregate({
                _sum: { value: true },
                where: { createdAt: { gte: startOfMonth(today) } },
            }),
            prisma.deal.aggregate({
                _sum: { value: true },
                where: { createdAt: { gte: lastMonthStart, lte: lastMonthEnd } },
            }),
            prisma.cRMActivity.count({ where: { createdAt: { gte: subDays(today, 7) } } }),

            // 2.3: groupBy assignedTo + _sum value → UNA query en lugar de N (una por usuario)
            // Reemplaza: prisma.user.findMany({ include: { assignedDeals } }) — era un N+1
            prisma.deal.groupBy({
                by: ["assignedTo"],
                where: {
                    stage: "WON",
                    assignedTo: { not: null },
                },
                _sum: { value: true },
                orderBy: { _sum: { value: "desc" } },
                take: 5,
            }),

            // 2.3: UNA sola query para el forecast completo (era 3 queries paralelas)
            // Filtramos en memoria por mes — DB round-trip: 3 → 1
            prisma.deal.findMany({
                where: {
                    stage: { notIn: ["WON", "LOST"] },
                    expectedClose: { gte: forecastWindowStart, lte: forecastWindowEnd },
                },
                select: { value: true, probability: true, expectedClose: true },
            }),
        ]);

        // 2.3: Enriquecer leaderboard con nombres de usuario en UNA query JOIN
        const assignedUserIds = leaderboardRaw
            .map((r) => r.assignedTo)
            .filter((id): id is string => !!id);

        const userNames = assignedUserIds.length > 0
            ? await prisma.user.findMany({
                where: { id: { in: assignedUserIds } },
                select: { id: true, name: true },
              })
            : [];
        const nameMap = new Map(userNames.map((u) => [u.id, u.name]));

        const rankedLeaderboard = leaderboardRaw.map((r) => ({
            name: nameMap.get(r.assignedTo!) || r.assignedTo || "Sin asignar",
            wonValue: r._sum.value || 0,
        }));

        // 2.3: Forecast calculado en memoria (1 DB query → 3 buckets in-memory)
        const forecastData = forecastMonths.map((month) => {
            const monthDeals = allForecastDeals.filter((d) => {
                const ec = d.expectedClose;
                return ec && ec >= month.start && ec <= month.end;
            });
            const weighted = monthDeals.reduce((acc, d) => acc + d.value * (d.probability / 100), 0);
            const total    = monthDeals.reduce((acc, d) => acc + d.value, 0);
            return { name: month.name, weighted: Math.round(weighted), total: Math.round(total) };
        });

        const forecastValue   = forecastData.reduce((acc, d) => acc + d.weighted, 0);
        const currentVal      = currentPipeline._sum.value || 0;
        const lastVal         = lastMonthPipeline._sum.value || 0;
        const momGrowth       = lastVal === 0 ? 100 : ((currentVal - lastVal) / lastVal) * 100;
        const totalDays       = wonDealsData.reduce((acc, deal) => {
            const diff = Math.abs(deal.updatedAt.getTime() - deal.createdAt.getTime());
            return acc + Math.ceil(diff / 86400000);
        }, 0);
        const avgDaysToClose  = wonDealsData.length > 0 ? Math.round(totalDays / wonDealsData.length) : 0;
        const wonValue        = wonDealsData.reduce((acc, deal) => acc + deal.value, 0);
        const monthlyTarget   = parseInt(process.env.MONTHLY_SALES_TARGET ?? "50000", 10);
        const goalProgress    = (wonValue / monthlyTarget) * 100;

        return {
            forecastValue: Math.round(forecastValue),
            forecastData,
            leadSources:   leadSources.map((ls) => ({ name: ls.source, value: ls._count.source })),
            lostReasons:   lostReasons.map((lr) => ({ reason: lr.lostReason || "Other", count: lr._count.lostReason })),
            stagnantDealsCount,
            momGrowth:     Math.round(momGrowth),
            avgDaysToClose,
            wonValue:      Math.round(wonValue),
            monthlyTarget,
            goalProgress:  Math.min(100, Math.round(goalProgress)),
            activityIntensity: recentActivitiesCount,
            winRate: wonDealsCount + lostDealsCount > 0
                ? Math.round((wonDealsCount / (wonDealsCount + lostDealsCount)) * 100)
                : 0,
            leaderboard: rankedLeaderboard,
        };
    } catch (error) {
        console.error("Failed to fetch high performance stats:", error);
        return { error: "Failed to load high performance stats" };
    }
}


// ─── DEAL ACTIONS ─────────────────────────────────────────────────────────────

export async function updateDealStage(dealId: string, stage: string) {
    const authCheck = await checkAuth();
    if (authCheck) return { error: "Unauthorized" };
    try {
        const oldDeal = await prisma.deal.findUnique({ where: { id: dealId }, select: { stage: true } });
        const deal = await prisma.deal.update({ where: { id: dealId }, data: { stage, lastActivity: new Date(), updatedAt: new Date() } });

        // ─── F5: Registrar en historial de etapas ──────────────────────────
        const userId = await getUserId();
        if (oldDeal && oldDeal.stage !== stage) {
            await prisma.dealStageHistory.create({
                data: {
                    dealId,
                    fromStage: oldDeal.stage,
                    toStage: stage,
                    changedBy: userId !== 'anonymous' ? userId : undefined,
                }
            }).catch(() => {}); // Non-fatal: table may not exist yet if migration pending
        }
        // ────────────────────────────────────────────────────────────────────


        // ─── BI-DIRECTIONAL SYNC: Pipeline Stage → Lead Status ──────────
        const leadStatusMap: Record<string, string> = {
            'NEW': 'NEW', 'CONTACTED': 'CONTACTED', 'QUALIFIED': 'QUALIFIED',
            'PROPOSAL': 'QUALIFIED', 'NEGOTIATION': 'QUALIFIED',
            'WON': 'CONVERTED', 'LOST': 'LOST',
        };
        const newLeadStatus = leadStatusMap[stage];
        if (newLeadStatus) {
            // Strategy 1: via formal convertedToDealId link
            // Strategy 2: via email match (for leads created via createLead)
            const emailFromTitle = deal.title?.match(/^Lead:\s+(.+@.+\..+)$/i)?.[1]?.trim();
            const emailToSearch = deal.contactEmail || emailFromTitle;

            const whereClause = emailToSearch
                ? { OR: [{ convertedToDealId: dealId }, { email: { equals: emailToSearch, mode: 'insensitive' as const }, companyId: deal.companyId }] }
                : { convertedToDealId: dealId };

            const linkedLeads = await prisma.lead.findMany({ where: whereClause, select: { id: true, status: true } });
            const toUpdate = linkedLeads.filter(l => l.status !== newLeadStatus);
            if (toUpdate.length > 0) {
                await prisma.lead.updateMany({
                    where: { id: { in: toUpdate.map(l => l.id) } },
                    data: { status: newLeadStatus, ...(newLeadStatus === 'CONVERTED' ? { convertedAt: new Date() } : {}), updatedAt: new Date() }
                });
                revalidatePath("/dashboard/admin/crm/leads");
                console.log(`[Pipeline→Lead Sync] ✅ Deal "${deal.title}" → stage ${stage} → updated ${toUpdate.length} lead(s) to "${newLeadStatus}"`);
            } else {
                console.log(`[Pipeline→Lead Sync] ℹ️ Deal "${deal.title}" → stage ${stage} → email: ${emailToSearch} → no leads found to update`);
            }
        }
        // ─────────────────────────────────────────────────────────────────

        // FASE 2: Automatización de Tareas Inteligentes
        if (stage === "WON") {
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + 1); // Deadline mañana

            const _userId = await getUserId();

            await prisma.task.create({
                data: {
                    title: `[Automatizado] Iniciar Onboarding para Deal: ${deal.title}`,
                    description: `Reunir requisitos iniciales y enviar contrato/factura. Valor Ganado: $${deal.value}.`,
                    completed: false,
                    priority: deal.value > 10000 ? "HIGH" : "MEDIUM",
                    dueDate: dueDate,
                    dealId: deal.id,
                    companyId: deal.companyId,
                    assignedTo: deal.assignedTo, // Assumes it goes back to the deal owner
                    createdBy: _userId !== "anonymous" ? _userId : "SYSTEM", // Se puede caer si es SYSTEM y no existe en BD, veamos si getUserId es fiable.
                }
            });

            // Crear actividad de feed para reportes
            await createDealActivity(deal.id, 'SYSTEM', 'El deal ha pasado a GANADO y se generó la tarea de Onboarding automáticamente.')

            // ─── E: Auto-crear Comisión cuando deal = WON ────────────────
            try {
                const fullDeal = await prisma.deal.findUnique({ where: { id: dealId }, select: { assignedTo: true, companyId: true, value: true } });
                if (fullDeal?.assignedTo) {
                    const { autoCreateCommission } = await import("@/actions/crm-commissions");
                    await autoCreateCommission(dealId, fullDeal.companyId, fullDeal.assignedTo);
                }
            } catch (commErr) {
                console.warn("[AutoCommission] Non-fatal error:", commErr);
            }
            // ──────────────────────────────────────────────────────────────
        }

        // FASE 7: Broad Audience Training (S2S) FOR ALL DEAL STAGES
        const companyId = deal.companyId;
        if (companyId) {
            const lead = await prisma.lead.findFirst({ where: { convertedToDealId: dealId } });
            
            // Ultra-Professional Architecture Note: Fallback to Deal's innate contact data
            // if no CRM Lead is formally attached (e.g. manually created Pipeline deals)
            const targetEmail = lead?.email || deal.contactEmail;
            
            if (targetEmail) {
                const userData = {
                    email: targetEmail,
                    phone: lead?.phone || undefined,
                    firstName: lead?.name?.split(' ')[0] || deal.contactName?.split(' ')[0],
                    lastName: lead?.name?.split(' ').slice(1).join(' ') || deal.contactName?.split(' ').slice(1).join(' '),
                    fbc: lead?.fbc,
                    fbp: lead?.fbp,
                };

                // 2.1: Pre-batch all integrationConfigs in ONE query (was 4 separate queries)
                const activeIntegrations = await prisma.integrationConfig.findMany({
                    where: {
                        companyId,
                        isEnabled: true,
                        provider: { in: ['facebook', 'facebook-pixel', 'tiktok', 'google', 'google-analytics', 'linkedin'] },
                    },
                    select: { provider: true, config: true },
                });
                const integrationMap = new Map(activeIntegrations.map(i => [i.provider, i.config]));
                
                if (stage === "WON") {
                    await triggerMetaCapi(companyId, 'Purchase', userData, { value: deal.value, currency: 'USD', contentName: deal.title }, integrationMap);
                    await triggerTiktokCapi(companyId, 'Purchase', userData, { value: deal.value, currency: 'USD', contentName: deal.title });
                    await triggerGoogleCapi(companyId, 'purchase', userData, { value: deal.value, currency: 'USD', transaction_id: deal.id });
                    await triggerLinkedinCapi(companyId, userData, { amount: deal.value, currencyCode: 'USD' });
                } else if (stage === "CONTACTED") {
                    await triggerMetaCapi(companyId, 'Contact', userData, { method: 'CRM_MANUAL' }, integrationMap);
                    await triggerTiktokCapi(companyId, 'Contact', userData, { contentName: 'Deal Contacted' });
                    await triggerGoogleCapi(companyId, 'contact_lead', userData, { lead_status: 'CONTACTED' });
                    await triggerLinkedinCapi(companyId, userData, { amount: 10, currencyCode: 'USD' });
                } else if (stage === "QUALIFIED") {
                    await triggerMetaCapi(companyId, 'Lead', userData, { leadType: 'B2B/CRM' }, integrationMap);
                    await triggerTiktokCapi(companyId, 'QualifiedLead', userData, { contentName: 'Deal Qualified' });
                    await triggerGoogleCapi(companyId, 'qualify_lead', userData, { lead_status: 'QUALIFIED' });
                    await triggerLinkedinCapi(companyId, userData, { amount: 50, currencyCode: 'USD' });
                } else if (stage === "PROPOSAL") {
                    await triggerMetaCapi(companyId, 'StartTrial', userData, { leadType: 'B2B/CRM' }, integrationMap);
                    await triggerTiktokCapi(companyId, 'SubmitForm', userData, { contentName: 'Proposal Sent' });
                    await triggerGoogleCapi(companyId, 'begin_checkout', userData, { value: deal.value });
                    await triggerLinkedinCapi(companyId, userData, { amount: 150, currencyCode: 'USD' });
                } else if (stage === "NEGOTIATION") {
                    await triggerMetaCapi(companyId, 'CustomizeProduct', userData, { leadType: 'B2B/CRM' }, integrationMap);
                    await triggerTiktokCapi(companyId, 'AddToCart', userData, { contentName: 'Negotiating' });
                    await triggerGoogleCapi(companyId, 'add_shipping_info', userData, { value: deal.value });
                    await triggerLinkedinCapi(companyId, userData, { amount: 300, currencyCode: 'USD' });
                }
            }
        }

        // ─── AUTOMATION ENGINE: Dispara workflows de tipo DEAL_STAGE_CHANGED ─
        triggerWorkflow('DEAL_STAGE_CHANGED', {
            stage,
            dealId: deal.id,
            dealTitle: deal.title,
            dealValue: deal.value,
            companyName: deal.companyId,
            contactEmail: deal.contactEmail,
            contactName: deal.contactName,
            assignedTo: deal.assignedTo,
        }).catch(e => console.error('[AutoEngine] DEAL_STAGE_CHANGED trigger failed:', e));
        // ─────────────────────────────────────────────────────────────────────

        revalidatePath("/dashboard/admin/crm");
        return { success: true };
    } catch (error) {
        console.error(error);
        return { error: "Failed to update deal" };
    }
}

export async function updateDeal(dealId: string, data: Record<string, unknown>) {
    const authCheck = await checkAuth();
    if (authCheck) return { error: "Unauthorized" };
    try {
        await prisma.deal.update({ where: { id: dealId }, data: { ...data, updatedAt: new Date() } });
        revalidatePath("/dashboard/admin/crm");
        return { success: true };
    } catch (error) {
        console.error(error);
        return { error: "Failed to update deal" };
    }
}

export async function deleteDeal(dealId: string) {
    const authCheck = await checkAuth();
    if (authCheck) return { error: "Unauthorized" };
    try {
        await prisma.deal.delete({ where: { id: dealId } });
        revalidatePath("/dashboard/admin/crm");
        return { success: true };
    } catch (error) {
        console.error(error);
        return { error: "Failed to delete deal" };
    }
}

export async function createDeal(data: Record<string, unknown>) {
    const authCheck = await checkAuth();
    if (authCheck) return { error: "Unauthorized" };
    const userId = await getUserId();
    const allowed = await rateLimit(`create_deal:${userId}`, 5, 60_000);
    if (!allowed) return { error: "Demasiadas peticiones. Espera un momento." };

    // --- SaaS B2B Quota Enforcer ---
    const { enforceQuota } = await import("@/lib/quotas");
    const companyId = data.companyId as string;
    
    // Obtenemos tier directamente desde la DB (por seguridad vs enviarlo desde el cliente)
    const company = await prisma.company.findUnique({ where: { id: companyId }, select: { subscriptionTier: true }});
    if (!company) return { error: "Tenant B2B no localizado." };
    
    const quota = await enforceQuota(companyId, "leads", company.subscriptionTier);
    if (!quota.allowed) {
        return { error: `Has superado las operaciones permitidas en tu plan ${company.subscriptionTier.toUpperCase()} (${quota.limit}/mes). Ve a Configuración > Facturación para aumentar tus límites.` };
    }
    // -------------------------------

    try {
        const deal = await prisma.deal.create({
            data: {
                title: data.title as string,
                value: data.value as number,
                stage: (data.stage as string) || "NEW",
                priority: (data.priority as string) || "MEDIUM",
                probability: (data.probability as number) || 10,
                contactName: data.contactName as string | undefined,
                contactEmail: data.contactEmail as string | undefined,
                companyId: data.companyId as string,
                notes: data.notes as string | undefined,
                expectedClose: data.expectedClose ? new Date(data.expectedClose as string) : undefined,
                source: (data.source as string) || "MANUAL",
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        });

        // ====================================================================
        // INTEGRACIÓN BIDIRECCIONAL: Si el Deal incluye email, crear/verificar Lead
        // ====================================================================
        if (data.contactEmail && typeof data.contactEmail === "string") {
            const existingLead = await prisma.lead.findFirst({
                where: {
                    email: data.contactEmail.toLowerCase(),
                    companyId: data.companyId as string
                }
            });

            if (!existingLead) {
                // Crear el Lead espejo automáticamente
                await prisma.lead.create({
                    data: {
                        name: (data.contactName as string) || null,
                        email: data.contactEmail.toLowerCase(),
                        phone: (data.contactPhone as string) || null,
                        company: (data.contactCompany as string) || null,
                        message: (data.notes as string) || `Creado automáticamente desde Pipeline para el Deal: ${deal.title}`,
                        source: (data.source as string) || "DIRECT",
                        utmSource: (data.utmSource as string) || null,
                        utmMedium: (data.utmMedium as string) || null,
                        utmCampaign: (data.utmCampaign as string) || null,
                        companyId: data.companyId as string,
                        status: "NEW", // Lead enters as NEW
                    }
                });
                revalidatePath("/dashboard/admin/crm/leads");
            }
        }

        // FASE 7: Broad Audience Training: Meta, TikTok, GA4, LinkedIn trigger for NEW Lead
        if (deal.companyId) {
            const userData = {
                email: data.contactEmail as string,
                phone: data.contactPhone as string,
                firstName: (data.contactName as string)?.split(' ')[0],
                lastName: (data.contactName as string)?.split(' ').slice(1).join(' '),
            };
            await triggerMetaCapi(deal.companyId, 'Lead', userData, {
                leadSource: data.source || 'MANUAL',
            });
            await triggerTiktokCapi(deal.companyId, 'SubmitForm', userData, {
                contentName: 'CRM Deal Creation',
            });
            await triggerGoogleCapi(deal.companyId, 'generate_lead', userData, {
                lead_source: data.source || 'MANUAL'
            });
            await triggerLinkedinCapi(deal.companyId, userData, {
                amount: 0,
                currencyCode: 'USD'
            });
        }

        revalidatePath("/dashboard/admin/crm");
        revalidatePath("/dashboard/admin/crm/pipeline");
        return { success: true, id: deal.id };
    } catch (error) {
        console.error(error);
        return { error: "Failed to create deal" };
    }
}

// ─── LEAD ACTIONS ─────────────────────────────────────────────────────────────

export interface LeadFilters {
    status?: string;
    source?: string;
    scoreMin?: number;
    scoreMax?: number;
    assignedTo?: string;
    search?: string;
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
}

export async function getLeads(companyId: string, filters: LeadFilters = {}) {
    // Auth is handled at the dashboard middleware level
    const { status, source, scoreMin = 0, scoreMax = 100, search, page = 1, pageSize = 20, sortBy = "createdAt", sortOrder = "desc" } = filters;

    try {
        const where = {
            companyId,
            ...(status && { status }),
            ...(source && { source }),
            score: { gte: scoreMin, lte: scoreMax },
            ...(search && {
                OR: [
                    { name: { contains: search, mode: "insensitive" as const } },
                    { email: { contains: search, mode: "insensitive" as const } },
                    { company: { contains: search, mode: "insensitive" as const } },
                ],
            }),
        };

        const [leads, total] = await Promise.all([
            prisma.lead.findMany({
                where,
                orderBy: { [sortBy]: sortOrder },
                skip: (page - 1) * pageSize,
                take: pageSize,
                select: {
                    id: true, name: true, email: true, phone: true, company: true,
                    status: true, source: true, score: true, assignedTo: true,
                    createdAt: true, updatedAt: true, tags: true,
                    utmSource: true, utmCampaign: true, convertedAt: true,
                },
            }),
            prisma.lead.count({ where }),
        ]);

        return { leads, total, pages: Math.ceil(total / pageSize), page };
    } catch (error) {
        console.error(error);
        return { error: "Failed to fetch leads" };
    }
}

export async function getLeadById(id: string) {
    // Auth is handled at the dashboard middleware level — no redundant checkAuth here
    // Fetch the core lead first (guaranteed to succeed if the lead exists)
    try {
        const lead = await prisma.lead.findUnique({
            where: { id },
            include: {
                campaign: { select: { id: true, name: true, platform: true, code: true } },
            },
        });
        if (!lead) return { error: "Lead not found" };

        // Fetch optional relations independently — any failure here is non-fatal
        let conversations: { id: string; channel: string; status: string; lastMessageAt: Date | null; lastMessagePreview: string | null }[] = [];
        let marketingEvents: { id: string; eventType: string; eventName: string | null; url: string | null; createdAt: Date }[] = [];

        try {
            conversations = await prisma.conversation.findMany({
                where: { leadId: id },
                take: 5,
                orderBy: { updatedAt: "desc" },
                select: { id: true, channel: true, status: true, lastMessageAt: true, lastMessagePreview: true },
            });
        } catch { /* conversations unavailable — ignore */ }

        try {
            marketingEvents = await prisma.marketingEvent.findMany({
                where: { leadId: id },
                take: 10,
                orderBy: { createdAt: "desc" },
                select: { id: true, eventType: true, eventName: true, url: true, createdAt: true },
            });
        } catch { /* marketingEvents unavailable — ignore */ }

        return { lead: { ...lead, conversations, marketingEvents } };
    } catch (error) {
        console.error("[getLeadById] Failed:", error);
        return { error: "Failed to fetch lead" };
    }
}




export async function updateLead(id: string, data: Record<string, unknown>) {
    const authCheck = await checkAuth();
    if (authCheck) return { error: "Unauthorized" };
    try {
        const oldLead = await prisma.lead.findUnique({ where: { id } });
        const lead = await prisma.lead.update({ where: { id }, data: { ...data, updatedAt: new Date() } });

        // FASE 7: Broad Audience Training: Meta, TikTok, GA4, LinkedIn triggers for Lead Lifecycle
        const isStatusChanged = data.status && data.status !== oldLead?.status;
        
        if (isStatusChanged) {
            const companyId = lead.companyId;
            const userData = {
                email: lead.email,
                phone: lead.phone,
                firstName: lead.name?.split(' ')[0],
                lastName: lead.name?.split(' ').slice(1).join(' '),
                fbc: lead.fbc,
                fbp: lead.fbp,
            };

            if (data.status === "QUALIFIED") {
                await triggerMetaCapi(companyId, 'QualifiedLead', userData, { leadType: 'B2B/CRM', score: lead.score });
                await triggerTiktokCapi(companyId, 'QualifiedLead', userData, { contentName: 'Qualified CRM Lead' });
                await triggerGoogleCapi(companyId, 'qualify_lead', userData, { lead_status: 'QUALIFIED' });
                await triggerLinkedinCapi(companyId, userData, { amount: 50 }); // Optional arbitrary val for ML
            } else if (data.status === "CONTACTED") {
                await triggerMetaCapi(companyId, 'Contact', userData, { method: 'CRM_MANUAL' });
                await triggerTiktokCapi(companyId, 'Contact', userData, { contentName: 'Contacted CRM Lead' });
                await triggerGoogleCapi(companyId, 'contact_lead', userData, { lead_status: 'CONTACTED' });
                await triggerLinkedinCapi(companyId, userData, { amount: 10 });
            } else if (data.status === "NEW") {
                await triggerMetaCapi(companyId, 'Lead', userData, { source: lead.source });
                await triggerTiktokCapi(companyId, 'SubmitForm', userData, { contentName: 'New CRM Lead' });
                await triggerGoogleCapi(companyId, 'generate_lead', userData, { lead_status: 'NEW' });
                await triggerLinkedinCapi(companyId, userData, { amount: 0 });
            }

            // ─── SYNC: Lead Status → Pipeline Deal Stage ────────────────────
            // When a lead status changes, update the corresponding Deal stage
            const leadStatusToDealStage: Record<string, string> = {
                'NEW': 'NEW',
                'CONTACTED': 'CONTACTED',
                'QUALIFIED': 'QUALIFIED',
                'CONVERTED': 'WON',
                'LOST': 'LOST',
            };
            const newDealStage = leadStatusToDealStage[data.status as string];
            if (newDealStage) {
                const linkedDeals = await prisma.deal.findMany({
                    where: {
                        contactEmail: { equals: lead.email, mode: 'insensitive' },
                        companyId: lead.companyId,
                        stage: { not: newDealStage },
                    },
                    select: { id: true, stage: true, title: true }
                });
                if (linkedDeals.length > 0) {
                    await prisma.deal.updateMany({
                        where: { id: { in: linkedDeals.map(d => d.id) } },
                        data: { stage: newDealStage, updatedAt: new Date() }
                    });
                    revalidatePath("/dashboard/admin/crm/pipeline");
                    console.log(`[Lead→Pipeline Sync] ✅ Lead "${lead.email}" status→${data.status} → updated ${linkedDeals.length} deal(s) to stage "${newDealStage}"`);
                } else {
                    console.log(`[Lead→Pipeline Sync] ℹ️ Lead "${lead.email}" status→${data.status} → no deals found to update`);
                }
            }
            // ────────────────────────────────────────────────────────────────
        }

        revalidatePath(`/dashboard/admin/crm/leads/${id}`);
        revalidatePath("/dashboard/admin/crm/leads");
        return { success: true };
    } catch (error) {
        console.error(error);
        return { error: "Failed to update lead" };
    }
}

export async function bulkUpdateLeads(ids: string[], data: Record<string, unknown>) {
    // 1.4: Validar scope de tenant — los ids DEBEN pertenecer al companyId del usuario
    const ctx = await getAuthContext().catch(authErrorToResponse);
    if ('error' in ctx) return ctx;
    const { companyId } = ctx;
    try {
        // Inyectar companyId en el where para prevenir cross-tenant updates
        await prisma.lead.updateMany({
            where: { id: { in: ids }, companyId },
            data: { ...data, updatedAt: new Date() },
        });
        revalidatePath("/dashboard/admin/crm/leads");
        return { success: true, count: ids.length };
    } catch (error) {
        console.error(error);
        return { error: "Failed to bulk update leads" };
    }
}

export async function convertLeadToDeal(leadId: string, dealData: { title: string; value: number; companyId: string; probability?: number; expectedClose?: string }) {
    const authCheck = await checkAuth();
    if (authCheck) return { error: "Unauthorized" };
    try {
        const lead = await prisma.lead.findUnique({ where: { id: leadId }, select: { name: true, email: true, phone: true } });
        if (!lead) return { error: "Lead not found" };

        const [deal] = await prisma.$transaction([
            prisma.deal.create({
                data: {
                    title: dealData.title,
                    value: dealData.value,
                    stage: "QUALIFIED",
                    probability: dealData.probability ?? 30,
                    contactName: lead.name ?? undefined,
                    contactEmail: lead.email,
                    companyId: dealData.companyId,
                    source: "LEAD_CONVERTED",
                    expectedClose: dealData.expectedClose ? new Date(dealData.expectedClose) : undefined,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            }),
            prisma.lead.update({
                where: { id: leadId },
                data: { status: "CONVERTED", convertedAt: new Date(), updatedAt: new Date() },
            }),
        ]);

        revalidatePath("/dashboard/admin/crm/leads");
        revalidatePath("/dashboard/admin/crm/pipeline");
        return { success: true, dealId: deal.id };
    } catch (error) {
        console.error(error);
        return { error: "Failed to convert lead to deal" };
    }
}

export async function createLead(data: {
    email: string; name?: string; phone?: string; company?: string;
    source: string; message?: string; companyId: string;
    utmSource?: string; utmMedium?: string; utmCampaign?: string;
    formData?: Record<string, unknown>;
    pipelineStage?: string; // Stage of the deal in the pipeline (e.g., QUALIFIED, PROPOSAL)
}) {
    // 3.3: Auth check + quota check en createLead (anteriormente ausentes)
    const authCheck = await checkAuth();
    if (authCheck) return { error: "Unauthorized" };
    const userId = await getUserId();
    const allowed = await rateLimit(`create_lead:${userId}`, 20, 60_000);
    if (!allowed) return { error: "Demasiadas peticiones. Espera un momento." };

    const { enforceQuota } = await import("@/lib/quotas");
    const company = await prisma.company.findUnique({ where: { id: data.companyId }, select: { subscriptionTier: true } });
    if (!company) return { error: "Tenant no localizado." };
    const quota = await enforceQuota(data.companyId, "leads", company.subscriptionTier);
    if (!quota.allowed) {
        return { error: `Has superado el límite de leads en tu plan ${company.subscriptionTier.toUpperCase()} (${quota.limit}/mes). Ve a Configuración > Facturación para aumentar tus límites.` };
    }

    try {
        // Map pipelineStage → lead status
        const leadStatusMap: Record<string, string> = {
            NEW: 'NEW', CONTACTED: 'CONTACTED', QUALIFIED: 'QUALIFIED',
            PROPOSAL: 'QUALIFIED', NEGOTIATION: 'QUALIFIED', WON: 'CONVERTED',
        };
        const dealStage = data.pipelineStage || 'NEW';
        const leadStatus = leadStatusMap[dealStage] || 'NEW';

        const lead = await prisma.lead.create({
            data: {
                email: data.email, name: data.name, phone: data.phone,
                company: data.company, source: data.source, message: data.message,
                companyId: data.companyId,
                utmSource: data.utmSource, utmMedium: data.utmMedium, utmCampaign: data.utmCampaign,
                formData: (data.formData ?? {}) as any,
                status: leadStatus, score: 0,
            },
        });

        // Sync immediately with Sales Pipeline as a Deal in the correct stage
        await prisma.deal.create({
            data: {
                title: data.name ? `Lead: ${data.name}` : `Lead: ${data.email}`,
                value: 0,
                stage: dealStage, // ← Use the actual stage selected by the user
                priority: "MEDIUM",
                contactName: data.name || "",
                contactEmail: data.email,
                source: data.source || "Unknown",
                companyId: data.companyId,
            }
        });

        revalidatePath("/dashboard/admin/crm/leads");
        revalidatePath("/dashboard/admin/crm/pipeline");
        return { success: true, id: lead.id };
    } catch (error) {
        console.error(error);
        return { error: "Failed to create lead" };
    }
}

export async function checkDuplicateEmail(email: string, companyId: string): Promise<{ isDuplicate: boolean; leadId?: string; leadName?: string }> {
    try {
        const existing = await prisma.lead.findFirst({
            where: { email: { equals: email, mode: "insensitive" }, companyId },
            select: { id: true, name: true },
        });
        if (existing) return { isDuplicate: true, leadId: existing.id, leadName: existing.name ?? undefined };
        return { isDuplicate: false };
    } catch {
        return { isDuplicate: false };
    }
}


// ─── ACTIVITY ACTIONS ─────────────────────────────────────────────────────────

export async function createDealActivity(dealId: string, type: string, content: string) {
    const authCheck = await checkAuth();
    if (authCheck) return { error: "Unauthorized" };
    const userId = await getUserId();
    try {
        await prisma.cRMActivity.create({ data: { dealId, type, content, userId, createdAt: new Date(), updatedAt: new Date() } });
        revalidatePath("/dashboard/admin/crm");
        return { success: true };
    } catch (error) {
        console.error(error);
        return { error: "Failed to create activity" };
    }
}

export async function getDealActivities(dealId: string) {
    const authCheck = await checkAuth();
    if (authCheck) return [];
    try {
        return await prisma.cRMActivity.findMany({
            where: { dealId },
            orderBy: { createdAt: "desc" },
            include: { user: { select: { name: true, image: true } } },
        });
    } catch {
        return [];
    }
}

// ─── CAMPAIGN ACTIONS ─────────────────────────────────────────────────────────

export async function getCampaigns(companyId: string) {
    const authCheck = await checkAuth();
    if (authCheck) return { error: "Unauthorized" };
    try {
        const campaigns = await prisma.campaign.findMany({
            where: { companyId },
            orderBy: { createdAt: "desc" },
            include: { _count: { select: { leads: true } } },
        });

        return campaigns.map((c) => {
            const cpl = c.conversions > 0 && c.spend > 0 ? c.spend / c.conversions : 0;
            const revenue = c._count.leads * 150; // avg lead value
            const roas = c.spend > 0 ? revenue / c.spend : 0;
            const ctr = c.impressions > 0 ? (c.clicks / c.impressions) * 100 : 0;
            return { ...c, leadCount: c._count.leads, cpl: Math.round(cpl), roas: parseFloat(roas.toFixed(2)), ctr: parseFloat(ctr.toFixed(2)) };
        });
    } catch (error) {
        console.error(error);
        return { error: "Failed to fetch campaigns" };
    }
}

export async function createCampaign(data: {
    name: string; code: string; platform: string; budget?: number;
    startDate?: string; endDate?: string; description?: string; companyId: string;
}) {
    const authCheck = await checkAuth();
    if (authCheck) return { error: "Unauthorized" };
    try {
        const campaign = await prisma.campaign.create({
            data: {
                name: data.name,
                code: data.code.toUpperCase().replace(/\s+/g, "-"),
                platform: data.platform,
                budget: data.budget,
                startDate: data.startDate ? new Date(data.startDate) : undefined,
                endDate: data.endDate ? new Date(data.endDate) : undefined,
                description: data.description,
                companyId: data.companyId,
                status: "ACTIVE",
            },
        });
        revalidatePath("/dashboard/admin/crm/campaigns");
        return { success: true, id: campaign.id };
    } catch (error) {
        console.error(error);
        return { error: "Failed to create campaign" };
    }
}

export async function updateCampaignMetrics(id: string, metrics: { impressions?: number; clicks?: number; conversions?: number; spend?: number }) {
    const authCheck = await checkAuth();
    if (authCheck) return { error: "Unauthorized" };
    try {
        await prisma.campaign.update({ where: { id }, data: { ...metrics, updatedAt: new Date() } });
        revalidatePath("/dashboard/admin/crm/campaigns");
        return { success: true };
    } catch (error) {
        console.error(error);
        return { error: "Failed to update metrics" };
    }
}

export async function updateCampaignStatus(id: string, status: "ACTIVE" | "PAUSED" | "COMPLETED") {
    const authCheck = await checkAuth();
    if (authCheck) return { error: "Unauthorized" };
    try {
        await prisma.campaign.update({ where: { id }, data: { status, updatedAt: new Date() } });
        revalidatePath("/dashboard/admin/crm/campaigns");
        return { success: true };
    } catch (error) {
        console.error(error);
        return { error: "Failed to update campaign status" };
    }
}

// ─── MISC ─────────────────────────────────────────────────────────────────────

export async function createTeam(name: string, companyId: string, parentId?: string) {
    const authCheck = await checkAuth();
    if (authCheck) return { error: "Unauthorized" };
    try {
        await prisma.team.create({ data: { name, companyId, parentId: parentId || null } });
        revalidatePath("/dashboard/admin/crm");
        return { success: true };
    } catch (error) {
        console.error(error);
        return { error: "Failed to create team" };
    }
}

export async function createCustomObjectDefinition(data: { name: string; label?: string; description?: string; companyId: string; apiName?: string }) {
    const authCheck = await checkAuth();
    if (authCheck) return { error: "Unauthorized" };
    try {
        await prisma.customObjectDefinition.create({ data: { name: data.name, label: data.label ?? data.name, description: data.description, companyId: data.companyId } });
        revalidatePath("/dashboard/admin/crm");
        return { success: true };
    } catch (error) {
        console.error(error);
        return { error: "Failed to create custom object definition" };
    }
}

// ─── PRIVATE HELPERS ──────────────────────────────────────────────────────────

async function triggerMetaCapi(companyId: string, eventName: any, userData: any, customData: any, integrationMap?: Map<string, any>) {
    try {
        // 2.1: Usar integrationMap pre-cargado si está disponible; si no, hacer query individual (fallback)
        let config: any;
        if (integrationMap) {
            config = integrationMap.get('facebook') || integrationMap.get('facebook-pixel');
        } else {
            const configRecord = await prisma.integrationConfig.findFirst({
                where: { companyId, provider: { in: ['facebook', 'facebook-pixel'] }, isEnabled: true }
            });
            config = configRecord?.config;
        }

        if (!config) return;

        const pixelId = (config as any).pixelId;
        const accessToken = (config as any).capiToken || (config as any).accessToken;

        if (pixelId && accessToken) {
            await sendMetaCapiEvent({
                pixelId,
                accessToken,
                eventName,
                userData,
                customData,
            });
        }
    } catch (error) {
        console.error('[Meta CAPI Trigger] Error:', error);
    }
}

async function triggerTiktokCapi(companyId: string, eventName: string, userData: any, customData: any) {
    try {
        await sendTiktokCapiEvent(companyId, {
            eventName,
            userData: {
                email: userData.email,
                phone: userData.phone,
                clientIpAddress: userData.client_ip_address,
                clientUserAgent: userData.client_user_agent,
            },
            customData: {
                contentName: customData.contentName || 'CRM Lead Status Update',
                value: customData.value || 0,
                currency: customData.currency || 'USD'
            }
        }).catch(err => console.error(`[TikTok CAPI Dispatch] Background Warning:`, err));
    } catch (error) {
        console.error('[TikTok CAPI Trigger] Error:', error);
    }
}

async function triggerGoogleCapi(companyId: string, eventName: string, userData: any, eventParams: any) {
    try {
        await sendGa4Event(companyId, {
            eventName,
            userData: {
                email: userData.email,
                phone: userData.phone,
                firstName: userData.firstName,
                lastName: userData.lastName,
            },
            eventParams
        }).catch(err => console.error(`[Google CAPI Dispatch] Background Warning:`, err));
    } catch (error) {
        console.error('[Google CAPI Trigger] Error:', error);
    }
}

async function triggerLinkedinCapi(companyId: string, userData: any, conversionInfo: any) {
    try {
        await sendLinkedinCapiEvent(companyId, {
            userData: {
                email: userData.email,
                firstName: userData.firstName,
                lastName: userData.lastName,
            },
            conversionInfo: {
                currencyCode: conversionInfo.currencyCode || 'COP',
                amount: conversionInfo.amount || 0
            }
        }).catch(err => console.error(`[LinkedIn CAPI Dispatch] Background Warning:`, err));
    } catch (error) {
        console.error('[LinkedIn CAPI Trigger] Error:', error);
    }
}
