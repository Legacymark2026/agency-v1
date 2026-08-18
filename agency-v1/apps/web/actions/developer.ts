"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { randomBytes, createHash, createHmac } from "crypto";
import { sendEmail } from "@/lib/email";

const REVALIDATE = "/dashboard/settings";

// ═══════════════════════════════════════════════════════════
// API KEY MANAGEMENT
// ═══════════════════════════════════════════════════════════

export async function getApiKeys() {
    try {
        const session = await auth();
        if (!session?.user?.companyId) return { success: false, data: [] };

        const keys = await prisma.apiKey.findMany({
            where: { companyId: session.user.companyId, isActive: true },
            include: {
                user: { select: { firstName: true, lastName: true, email: true } },
            },
            orderBy: { createdAt: "desc" },
        });

        // Never expose the keyHash
        return {
            success: true,
            data: keys.map(k => ({
                id: k.id,
                name: k.name,
                prefix: k.prefix,
                scopes: k.scopes,
                isActive: k.isActive,
                expiresAt: k.expiresAt,
                createdAt: k.createdAt,
                createdBy: k.user,
            })),
        };
    } catch (error: any) {
        return { success: false, data: [], error: error.message };
    }
}

export async function createApiKey(name: string, scopes: string[], expiresInDays?: number) {
    try {
        const session = await auth();
        if (!session?.user?.companyId || !session?.user?.id)
            return { success: false, error: "Unauthorized" };

        const rawKey = `lm_live_${randomBytes(32).toString("hex")}`;
        const keyHash = createHash("sha256").update(rawKey).digest("hex");
        const prefix = rawKey.substring(0, 12);

        const expiresAt = expiresInDays 
            ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000) 
            : undefined;

        await prisma.apiKey.create({
            data: {
                name,
                keyHash,
                prefix,
                scopes,
                companyId: session.user.companyId,
                userId: session.user.id,
                expiresAt,
                createdBy: session.user.id,
            },
        });

        revalidatePath(REVALIDATE);
        // Return the full key ONLY at creation time
        return { success: true, key: rawKey };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function revokeApiKey(id: string) {
    try {
        const session = await auth();
        if (!session?.user?.companyId) return { success: false, error: "Unauthorized" };

        await prisma.apiKey.update({
            where: { id, companyId: session.user.companyId },
            data: { isActive: false },
        });

        revalidatePath(REVALIDATE);
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function rotateApiKey(id: string) {
    try {
        const session = await auth();
        if (!session?.user?.companyId) return { success: false, error: "Unauthorized" };

        const existing = await prisma.apiKey.findUnique({
            where: { id, companyId: session.user.companyId },
        });
        if (!existing) return { success: false, error: "Not found" };

        // Revoke old
        await prisma.apiKey.update({ where: { id }, data: { isActive: false } });

        // Create new with same name and same scopes
        const rawKey = `lm_live_${randomBytes(32).toString("hex")}`;
        const keyHash = createHash("sha256").update(rawKey).digest("hex");
        const prefix = rawKey.substring(0, 12);

        await prisma.apiKey.create({
            data: {
                name: existing.name,
                keyHash,
                prefix,
                scopes: (existing.scopes as string[]) || [], // FIX #5: preservar scopes originales
                expiresAt: existing.expiresAt, // Preservar expiración también
                companyId: existing.companyId,
                userId: session.user.id!,
                createdBy: session.user.id!,
            },
        });

        revalidatePath(REVALIDATE);
        return { success: true, key: rawKey };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// ═══════════════════════════════════════════════════════════
// WEBHOOK MANAGEMENT
// ═══════════════════════════════════════════════════════════

const WEBHOOK_EVENTS = [
    "lead.created", "lead.updated", "deal.won", "deal.lost",
    "payment.received", "payroll.paid", "invoice.sent",
    "contact.created", "conversation.started", "automation.triggered",
];

export async function getWebhookEvents() {
    return { success: true, events: WEBHOOK_EVENTS };
}

export async function getWebhooks() {
    try {
        const session = await auth();
        if (!session?.user?.companyId) return { success: false, data: [] };

        const webhooks = await prisma.webhook.findMany({
            where: { companyId: session.user.companyId },
            include: {
                _count: { select: { deliveryLogs: true } },
                deliveryLogs: {
                    orderBy: { deliveredAt: "desc" },
                    take: 1,
                    select: { statusCode: true, success: true, deliveredAt: true },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        return {
            success: true,
            data: webhooks.map(w => ({
                id: w.id,
                name: w.name,
                url: w.url,
                events: w.events,
                isActive: w.isActive,
                failureCount: w.failureCount,
                lastDeliveredAt: w.lastDeliveredAt,
                lastStatusCode: w.lastStatusCode,
                deliveryCount: w._count.deliveryLogs,
                lastDelivery: w.deliveryLogs[0] || null,
            })),
        };
    } catch (error: any) {
        return { success: false, data: [], error: error.message };
    }
}

export async function createWebhook(data: { name: string; url: string; events: string[] }) {
    try {
        const session = await auth();
        if (!session?.user?.companyId) return { success: false, error: "Unauthorized" };

        const secret = `whsec_${randomBytes(32).toString("hex")}`;

        const webhook = await prisma.webhook.create({
            data: {
                name: data.name,
                url: data.url,
                events: data.events,
                secret,
                companyId: session.user.companyId,
            },
        });

        revalidatePath(REVALIDATE);
        return { success: true, data: webhook, secret };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function updateWebhook(id: string, data: Partial<{ name: string; url: string; events: string[]; isActive: boolean }>) {
    try {
        const session = await auth();
        if (!session?.user?.companyId) return { success: false, error: "Unauthorized" };

        await prisma.webhook.update({
            where: { id, companyId: session.user.companyId },
            data,
        });

        revalidatePath(REVALIDATE);
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function deleteWebhook(id: string) {
    try {
        const session = await auth();
        if (!session?.user?.companyId) return { success: false, error: "Unauthorized" };

        await prisma.webhook.delete({ where: { id, companyId: session.user.companyId } });

        revalidatePath(REVALIDATE);
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function testWebhook(id: string) {
    try {
        const session = await auth();
        if (!session?.user?.companyId) return { success: false, error: "Unauthorized" };

        const webhook = await prisma.webhook.findUnique({
            where: { id, companyId: session.user.companyId },
        });
        if (!webhook) return { success: false, error: "Webhook not found" };

        const payload = JSON.stringify({
            event: "webhook.test",
            timestamp: new Date().toISOString(),
            data: { message: "This is a test delivery from LegacyMark", companyId: session.user.companyId },
        });

        const signature = createHmac("sha256", webhook.secret)
            .update(payload)
            .digest("hex");

        const start = Date.now();
        let statusCode: number | null = null;
        let responseBody: string | null = null;
        let success = false;

        try {
            const res = await fetch(webhook.url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-LegacyMark-Signature": `sha256=${signature}`,
                    "X-LegacyMark-Event": "webhook.test",
                },
                body: payload,
                signal: AbortSignal.timeout(10_000),
            });
            statusCode = res.status;
            responseBody = await res.text().catch(() => "");
            success = res.ok;
        } catch { /* timeout or network error */ }

        const durationMs = Date.now() - start;

        await prisma.$transaction([
            prisma.webhookDeliveryLog.create({
                data: {
                    webhookId: id,
                    event: "webhook.test",
                    statusCode,
                    responseBody: responseBody?.slice(0, 500),
                    payload,
                    durationMs,
                    success,
                },
            }),
            prisma.webhook.update({
                where: { id },
                data: {
                    lastDeliveredAt: new Date(),
                    lastStatusCode: statusCode,
                    failureCount: success ? 0 : { increment: 1 },
                },
            }),
        ]);

        return { success: true, statusCode, durationMs, responseBody: responseBody?.slice(0, 200), testPassed: success };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getWebhookDeliveryLogs(webhookId: string) {
    try {
        const session = await auth();
        if (!session?.user?.companyId) return { success: false, data: [] };

        const logs = await prisma.webhookDeliveryLog.findMany({
            where: { webhookId },
            orderBy: { deliveredAt: "desc" },
            take: 50,
        });

        return { success: true, data: logs };
    } catch (error: any) {
        return { success: false, data: [], error: error.message };
    }
}

// ═══════════════════════════════════════════════════════════
// NOTIFICATION PREFERENCES
// ═══════════════════════════════════════════════════════════

const NOTIFICATION_EVENTS = [
    // ── CRM ──────────────────────────────────────────────────────
    { key: "NEW_LEAD",               label: "Nuevo Lead Creado",               group: "CRM" },
    { key: "LEAD_ASSIGNED",          label: "Lead Asignado a Agente",          group: "CRM" },
    { key: "LEAD_STAGE_CHANGED",     label: "Etapa del Lead Cambiada",         group: "CRM" },
    { key: "LEAD_SCORED",            label: "Lead Score Actualizado",          group: "CRM" },
    { key: "LEAD_STALE",             label: "Lead Sin Actividad (Inactivo)",   group: "CRM" },
    { key: "CONTACT_MERGED",         label: "Contactos Fusionados",            group: "CRM" },
    { key: "CONTACT_BLACKLISTED",    label: "Contacto en Lista Negra",         group: "CRM" },

    // ── Ventas ────────────────────────────────────────────────────
    { key: "DEAL_WON",               label: "Negocio Ganado 🎉",              group: "Ventas" },
    { key: "DEAL_LOST",              label: "Negocio Perdido",                group: "Ventas" },
    { key: "DEAL_STAGNANT",          label: "Negocio Sin Movimiento",         group: "Ventas" },
    { key: "PROPOSAL_VIEWED",        label: "Cotización Vista por Cliente",   group: "Ventas" },
    { key: "PROPOSAL_SIGNED",        label: "Cotización Firmada ✅",          group: "Ventas" },
    { key: "PROPOSAL_REJECTED",      label: "Cotización Rechazada",           group: "Ventas" },
    { key: "PROPOSAL_EXPIRING",      label: "Cotización por Vencer",         group: "Ventas" },
    { key: "GOAL_REACHED",           label: "Meta de Ventas Alcanzada",       group: "Ventas" },
    { key: "GOAL_AT_RISK",           label: "Meta de Ventas en Riesgo",       group: "Ventas" },
    { key: "COMMISSION_APPROVED",    label: "Comisión Aprobada",              group: "Ventas" },

    // ── Finanzas ──────────────────────────────────────────────────
    { key: "PAYMENT_RECEIVED",       label: "Pago Recibido",                  group: "Finanzas" },
    { key: "PAYMENT_FAILED",         label: "Pago Rechazado / Fallido",       group: "Finanzas" },
    { key: "INVOICE_CREATED",        label: "Factura Generada",               group: "Finanzas" },
    { key: "INVOICE_OVERDUE",        label: "Factura Vencida",                group: "Finanzas" },
    { key: "INVOICE_DUE_SOON",       label: "Factura por Vencer (48h)",       group: "Finanzas" },
    { key: "PAYROLL_DUE",            label: "Nómina por Procesar",            group: "Finanzas" },
    { key: "PAYROLL_PROCESSED",      label: "Nómina Procesada",               group: "Finanzas" },
    { key: "EXPENSE_PENDING",        label: "Gasto Pendiente de Aprobación",  group: "Finanzas" },
    { key: "EXPENSE_APPROVED",       label: "Gasto Aprobado",                 group: "Finanzas" },
    { key: "EXPENSE_REJECTED",       label: "Gasto Rechazado",                group: "Finanzas" },
    { key: "BUDGET_EXCEEDED",        label: "Presupuesto Excedido",           group: "Finanzas" },
    { key: "TREASURY_LOW_BALANCE",   label: "Saldo Bajo en Tesorería",        group: "Finanzas" },

    // ── Inbox ─────────────────────────────────────────────────────
    { key: "NEW_CONVERSATION",       label: "Nueva Conversación",             group: "Inbox" },
    { key: "MESSAGE_RECEIVED",       label: "Mensaje Directo Recibido",       group: "Inbox" },
    { key: "MENTION",                label: "Mención en Comentario",          group: "Inbox" },
    { key: "CONVERSATION_ASSIGNED",  label: "Conversación Asignada",          group: "Inbox" },
    { key: "CONVERSATION_RESOLVED",  label: "Conversación Resuelta",          group: "Inbox" },
    { key: "CONVERSATION_REOPENED",  label: "Conversación Reabierta",         group: "Inbox" },

    // ── Soporte ───────────────────────────────────────────────────
    { key: "SLA_BREACH",             label: "⚠️ SLA Incumplido",              group: "Soporte" },
    { key: "SLA_WARNING",            label: "SLA en Riesgo (80%)",            group: "Soporte" },
    { key: "HUMAN_TRANSFER",         label: "Transferencia a Agente Humano",  group: "Soporte" },
    { key: "CSAT_NEGATIVE",          label: "Reseña Negativa CSAT",          group: "Soporte" },
    { key: "TICKET_ESCALATED",       label: "Ticket Escalado",                group: "Soporte" },
    { key: "TICKET_OVERDUE",         label: "Ticket Sin Respuesta",           group: "Soporte" },

    // ── Operaciones ───────────────────────────────────────────────
    { key: "TASK_ASSIGNED",          label: "Tarea Asignada",                 group: "Operaciones" },
    { key: "TASK_COMPLETED",         label: "Tarea Completada",               group: "Operaciones" },
    { key: "TASK_OVERDUE",           label: "Tarea Vencida",                  group: "Operaciones" },
    { key: "TASK_DUE_SOON",          label: "Tarea por Vencer Hoy",          group: "Operaciones" },
    { key: "PROJECT_MILESTONE",      label: "Milestone de Proyecto Alcanzado",group: "Operaciones" },
    { key: "PROJECT_DELAYED",        label: "Proyecto Retrasado",             group: "Operaciones" },
    { key: "KANBAN_BLOCKED",         label: "Tarjeta Bloqueada en Kanban",    group: "Operaciones" },
    { key: "TIMER_STARTED",          label: "Temporizador de Tarea Iniciado", group: "Operaciones" },
    { key: "TIMER_LIMIT_REACHED",    label: "Límite de Tiempo Alcanzado",     group: "Operaciones" },

    // ── RRHH ──────────────────────────────────────────────────────
    { key: "TIME_OFF_REQUESTED",     label: "Permiso de Ausencia Solicitado", group: "RRHH" },
    { key: "TIME_OFF_APPROVED",      label: "Permiso de Ausencia Aprobado",   group: "RRHH" },
    { key: "TIME_OFF_REJECTED",      label: "Permiso de Ausencia Rechazado",  group: "RRHH" },
    { key: "EMPLOYEE_ONBOARDED",     label: "Nuevo Empleado Incorporado",     group: "RRHH" },
    { key: "EMPLOYEE_OFFBOARDED",    label: "Empleado Dado de Baja",         group: "RRHH" },
    { key: "CONTRACT_EXPIRING",      label: "Contrato por Expirar",          group: "RRHH" },
    { key: "PERFORMANCE_REVIEW_DUE", label: "Evaluación de Desempeño Pendiente", group: "RRHH" },

    // ── Marketing ─────────────────────────────────────────────────
    { key: "CAMPAIGN_LAUNCHED",      label: "Campaña Lanzada",                group: "Marketing" },
    { key: "CAMPAIGN_COMPLETED",     label: "Campaña Completada",             group: "Marketing" },
    { key: "CAMPAIGN_PAUSED",        label: "Campaña Pausada",                group: "Marketing" },
    { key: "EMAIL_BLAST_SENT",       label: "Email Masivo Enviado",           group: "Marketing" },
    { key: "EMAIL_BOUNCE_HIGH",      label: "Alta Tasa de Rebote en Email",   group: "Marketing" },
    { key: "SOCIAL_PUBLISHED",       label: "Post Publicado en Redes",        group: "Marketing" },
    { key: "SOCIAL_FAILED",          label: "Error al Publicar en Redes",     group: "Marketing" },
    { key: "AD_BUDGET_DEPLETED",     label: "Presupuesto Publicitario Agotado", group: "Marketing" },
    { key: "AUTOMATION_ERROR",       label: "Error en Automatización",        group: "Marketing" },
    { key: "AUTOMATION_COMPLETED",   label: "Automatización Completada",      group: "Marketing" },

    // ── Agentes IA ────────────────────────────────────────────────
    { key: "AI_AGENT_SUSPENDED",     label: "Agente IA Suspendido",           group: "Agentes IA" },
    { key: "AI_CIRCUIT_BREAKER",     label: "Circuit Breaker Activado",       group: "Agentes IA" },
    { key: "AI_QUOTA_EXCEEDED",      label: "Cuota de Tokens IA Excedida",    group: "Agentes IA" },
    { key: "AI_HALLUCINATION_FLAG",  label: "Respuesta IA Marcada (Flag)",    group: "Agentes IA" },
    { key: "AI_AGENT_TRAINED",       label: "Agente IA Entrenado / Listo",    group: "Agentes IA" },
    { key: "AI_KB_UPDATED",          label: "Base de Conocimiento Actualizada", group: "Agentes IA" },

    // ── Contenido ─────────────────────────────────────────────────
    { key: "POST_PUBLISHED",         label: "Artículo Publicado",             group: "Contenido" },
    { key: "POST_COMMENT",           label: "Nuevo Comentario en Post",       group: "Contenido" },
    { key: "VIDEO_RENDER_COMPLETE",  label: "Video Renderizado Listo",        group: "Contenido" },
    { key: "VIDEO_RENDER_FAILED",    label: "Error al Renderizar Video",      group: "Contenido" },
    { key: "MEDIA_STORAGE_WARN",     label: "Almacenamiento Multimedia al 80%", group: "Contenido" },

    // ── Equipo ────────────────────────────────────────────────────
    { key: "MEMBER_JOINED",          label: "Nuevo Miembro del Equipo",       group: "Equipo" },
    { key: "MEMBER_REMOVED",         label: "Miembro Eliminado del Equipo",   group: "Equipo" },
    { key: "ROLE_CHANGED",           label: "Rol / Permisos Modificados",     group: "Equipo" },
    { key: "TEAM_INVITATION",        label: "Invitación Enviada al Equipo",   group: "Equipo" },

    // ── Seguridad ─────────────────────────────────────────────────
    { key: "SECURITY_LOGIN_UNUSUAL", label: "Inicio de Sesión Inusual",       group: "Seguridad" },
    { key: "SECURITY_MFA_DISABLED",  label: "MFA Desactivado en Cuenta",      group: "Seguridad" },
    { key: "SECURITY_API_KEY_USED",  label: "Clave API Utilizada",            group: "Seguridad" },
    { key: "SECURITY_PASSWORD_CHANGED", label: "Contraseña Cambiada",         group: "Seguridad" },
    { key: "SECURITY_EXPORT_DATA",   label: "Exportación de Datos Realizada", group: "Seguridad" },

    // ── Sistema ───────────────────────────────────────────────────
    { key: "SYSTEM_ALERT",           label: "Alerta Crítica del Sistema",     group: "Sistema" },
    { key: "SYSTEM_MAINTENANCE",     label: "Mantenimiento Programado",       group: "Sistema" },
    { key: "SYSTEM_UPDATE",          label: "Actualización de Plataforma",    group: "Sistema" },
    { key: "SYSTEM_BACKUP_DONE",     label: "Respaldo Automático Completado", group: "Sistema" },
    { key: "SYSTEM_BACKUP_FAILED",   label: "Error en Respaldo del Sistema",  group: "Sistema" },
    { key: "INTEGRATION_DOWN",       label: "Integración Externa Caída",      group: "Sistema" },
    { key: "INTEGRATION_RECOVERED",  label: "Integración Externa Recuperada", group: "Sistema" },
];

const CHANNELS = ["EMAIL", "WHATSAPP", "PUSH", "SLACK"] as const;

export async function getNotificationEvents() {
    return { success: true, events: NOTIFICATION_EVENTS };
}

export async function getNotificationPreferences() {
    try {
        const session = await auth();
        if (!session?.user?.id || !session?.user?.companyId) return { success: false, data: [] };

        const prefs = await prisma.notificationPreference.findMany({
            where: { userId: session.user.id, companyId: session.user.companyId },
        });

        // Build full matrix with defaults
        const matrix: Record<string, Record<string, { enabled: boolean; digest: string }>> = {};

        for (const evt of NOTIFICATION_EVENTS) {
            matrix[evt.key] = {};
            for (const channel of CHANNELS) {
                const existing = prefs.find(p => p.event === evt.key && p.channel === channel);
                matrix[evt.key][channel] = {
                    enabled: existing ? existing.enabled : ["EMAIL", "PUSH"].includes(channel),
                    digest: existing ? existing.digest : "IMMEDIATE",
                };
            }
        }

        return { success: true, data: matrix, events: NOTIFICATION_EVENTS };
    } catch (error: any) {
        return { success: false, data: {}, events: [], error: error.message };
    }
}

export async function updateNotificationPreference(
    event: string,
    channel: string,
    enabled: boolean,
    digest: string = "IMMEDIATE"
) {
    try {
        const session = await auth();
        if (!session?.user?.id || !session?.user?.companyId) return { success: false, error: "Unauthorized" };

        await prisma.notificationPreference.upsert({
            where: {
                userId_companyId_channel_event: {
                    userId: session.user.id,
                    companyId: session.user.companyId,
                    channel,
                    event,
                },
            },
            update: { enabled, digest },
            create: {
                userId: session.user.id,
                companyId: session.user.companyId,
                channel,
                event,
                enabled,
                digest,
            },
        });

        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// ═══════════════════════════════════════════════════════════
// INTEGRATION HEALTH DASHBOARD
// ═══════════════════════════════════════════════════════════

const INTEGRATIONS = [
    "GOOGLE", "META", "STRIPE", "PAYU", "HOTJAR",
    "TWILIO", "SLACK", "OPENAI", "ZAPIER", "HUBSPOT",
    "MAILCHIMP", "RESEND", "AWS_S3", "ZOHO", "DYNAMICS365",
];

export async function getIntegrationHealthDashboard() {
    try {
        const session = await auth();
        if (!session?.user?.companyId) return { success: false, data: [] };

        // Read all integration configs for this company from DB
        const configs = await prisma.integrationConfig.findMany({
            where: { companyId: session.user.companyId },
            select: { provider: true, isEnabled: true, updatedAt: true }
        });

        const configMap = new Map(configs.map(c => [c.provider, c]));

        // Canonical provider list — uses the current family provider IDs
        const ALL_PROVIDERS = [
            // Meta Family
            'meta-pixel', 'facebook-page', 'instagram-page', 'whatsapp',
            // Advertising
            'tiktok-ads', 'tiktok-messages',
            'linkedin-ads', 'linkedin-webhook',
            'google-ads', 'google-analytics', 'google-tag-manager', 'google-search-console',
            // Analytics / SEO
            'hotjar', 'ahrefs',
            // AI
            'ai-models',
            // Payments
            'payu',
            // Coming soon (library addons — stored with their own keys once connected)
            'hubspot', 'mailchimp',
        ];

        const result = ALL_PROVIDERS.map(key => {
            // Also check legacy keys (e.g. 'facebook', 'tiktok-pixel')
            const config = configMap.get(key) || configMap.get(legacyKey(key));
            let status: 'OK' | 'DEGRADED' | 'UNCONFIGURED' | 'ERROR';
            let message: string | null;

            if (!config) {
                status = 'UNCONFIGURED';
                message = null;
            } else if (config.isEnabled) {
                status = 'OK';
                message = `Configurada y activa · última actualización ${formatRelative(config.updatedAt)}`;
            } else {
                status = 'DEGRADED';
                message = 'Configurada pero desactivada';
            }

            return { key, status, checkedAt: new Date(), message, latencyMs: null };
        });

        return { success: true, data: result };
    } catch (error: any) {
        return { success: false, data: [], error: error.message };
    }
}

function legacyKey(provider: string): string {
    const map: Record<string, string> = {
        'meta-pixel': 'facebook-pixel',
        'facebook-page': 'facebook',
        'tiktok-ads': 'tiktok-pixel',
        'linkedin-ads': 'linkedin-insight',
    };
    return map[provider] || provider;
}

function formatRelative(date: Date): string {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);
    if (days > 0) return `hace ${days}d`;
    if (hours > 0) return `hace ${hours}h`;
    if (mins > 0) return `hace ${mins}m`;
    return 'ahora mismo';
}


export async function testIntegrationConnection(integration: string) {
    try {
        const session = await auth();
        if (!session?.user?.companyId) return { success: false, error: "Unauthorized" };

        // Get the integration config
        const config = await prisma.integrationConfig.findFirst({
            where: { companyId: session.user.companyId, provider: integration },
        });

        let status: "OK" | "ERROR" | "DEGRADED" | "UNCONFIGURED" = "UNCONFIGURED";
        let latencyMs: number | null = null;
        let message: string | null = null;

        if (!config || !config.isEnabled) {
            status = "UNCONFIGURED";
            message = "Integración no configurada";
        } else {
            // Simple connectivity check
            const start = Date.now();
            try {
                const target: Record<string, string> = {
                    GOOGLE: "https://accounts.google.com/.well-known/openid-configuration",
                    META: "https://graph.facebook.com/v19.0/me",
                    STRIPE: "https://api.stripe.com/v1",
                    HOTJAR: "https://www.hotjar.com",
                    TWILIO: "https://api.twilio.com",
                    SLACK: "https://slack.com/api/api.test",
                    OPENAI: "https://api.openai.com/v1/models",
                    MAILCHIMP: "https://us1.api.mailchimp.com/3.0/",
                    HUBSPOT: "https://api.hubapi.com/crm/v3/schemas",
                    RESEND: "https://api.resend.com/emails",
                };
                const url = target[integration] || "https://httpbin.org/get";
                const res = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(5000) });
                latencyMs = Date.now() - start;
                status = res.status < 500 ? "OK" : "DEGRADED";
                message = `HTTP ${res.status} en ${latencyMs}ms`;
            } catch {
                latencyMs = Date.now() - start;
                status = "ERROR";
                message = "No se pudo conectar al servicio";
            }
        }

        await prisma.integrationLog.create({
            data: {
                companyId: session.user.companyId,
                integration,
                status,
                latencyMs,
                message,
            },
        });

        return { success: true, status, latencyMs, message };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// ═══════════════════════════════════════════════════════════
// USAGE & BILLING
// ═══════════════════════════════════════════════════════════

export async function getUsageStats() {
    try {
        const session = await auth();
        if (!session?.user?.companyId) return { success: false, data: null };

        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const [apiCalls, leads, emailsSent, aiTokens, members] = await Promise.all([
            prisma.usageLog.aggregate({
                where: { companyId: session.user.companyId, metric: "API_CALLS", recordedAt: { gte: startOfMonth } },
                _sum: { value: true },
            }),
            prisma.lead.count({ where: { companyId: session.user.companyId } }),
            prisma.usageLog.aggregate({
                where: { companyId: session.user.companyId, metric: "EMAIL_SENT", recordedAt: { gte: startOfMonth } },
                _sum: { value: true },
            }),
            prisma.usageLog.aggregate({
                where: { companyId: session.user.companyId, metric: "AI_TOKENS", recordedAt: { gte: startOfMonth } },
                _sum: { value: true },
            }),
            prisma.companyUser.count({ where: { companyId: session.user.companyId } }),
        ]);

        return {
            success: true,
            data: {
                apiCalls: apiCalls._sum.value || 0,
                leads,
                emailsSent: emailsSent._sum.value || 0,
                aiTokens: aiTokens._sum.value || 0,
                members,
                // Plan limits (would come from DB in production)
                limits: { apiCalls: 100_000, leads: 10_000, emailsSent: 50_000, aiTokens: 1_000_000, members: 25 },
            },
        };
    } catch (error: any) {
        return { success: false, data: null, error: error.message };
    }
}

export async function getInvoices() {
    try {
        const session = await auth();
        if (!session?.user?.companyId) return { success: false, data: [] };

        const company = await prisma.company.findUnique({
            where: { id: session.user.companyId },
            select: { defaultCompanySettings: true, name: true, stripeCustomerId: true } as any,
        });

        const stripeKey = process.env.STRIPE_SECRET_KEY;
        const customerId = (company as any)?.stripeCustomerId;

        // ── Real Stripe invoices ───────────────────────────────────────────────
        if (stripeKey && customerId) {
            try {
                const stripeRes = await fetch(
                    `https://api.stripe.com/v1/invoices?customer=${customerId}&limit=24&status=paid`,
                    {
                        headers: {
                            Authorization: `Bearer ${stripeKey}`,
                            'Stripe-Version': '2024-04-10',
                        },
                        cache: 'no-store',
                    }
                );

                if (stripeRes.ok) {
                    const stripeData = await stripeRes.json();
                    const invoices = (stripeData.data || []).map((inv: any) => ({
                        id: inv.id,
                        date: new Date(inv.created * 1000),
                        amount: inv.amount_paid,          // in cents
                        currency: (inv.currency || 'usd').toUpperCase(),
                        status: inv.status === 'paid' ? 'PAID' : inv.status?.toUpperCase() ?? 'UNKNOWN',
                        downloadUrl: inv.invoice_pdf || inv.hosted_invoice_url || '#',
                        number: inv.number,
                        description: inv.description || inv.lines?.data?.[0]?.description,
                    }));
                    return { success: true, data: invoices, company };
                }

                const errBody = await stripeRes.json().catch(() => ({}));
                console.error('[getInvoices] Stripe API error:', stripeRes.status, errBody);
            } catch (e) {
                console.error('[getInvoices] Failed to fetch from Stripe:', e);
            }
        }

        // ── Stripe not configured or no customer ID ───────────────────────────
        // Return empty array — the billing UI should explain the situation honestly
        return {
            success: true,
            data: [],
            company,
            notice: !stripeKey
                ? 'Stripe no está configurado en el servidor (STRIPE_SECRET_KEY faltante).'
                : !customerId
                ? 'Esta empresa aún no tiene un Customer ID de Stripe. Las facturas aparecerán aquí una vez que se realice el primer pago.'
                : null,
        };
    } catch (error: any) {
        return { success: false, data: [], error: error.message };
    }
}

// ═══════════════════════════════════════════════════════════
// API USAGE LOGS (Developer dashboard)
// ═══════════════════════════════════════════════════════════

export async function getApiUsageLogs() {
    try {
        const session = await auth();
        if (!session?.user?.companyId) return { success: false, data: [] };

        const logs = await prisma.usageLog.findMany({
            where: { companyId: session.user.companyId },
            orderBy: { recordedAt: "desc" },
            take: 100,
        });

        return { success: true, data: logs };
    } catch (error: any) {
        return { success: false, data: [], error: error.message };
    }
}

// ═══════════════════════════════════════════════════════════
// TEAM INVITE (Members)
// ═══════════════════════════════════════════════════════════

export async function sendTeamInvite(email: string, role: string) {
    try {
        const session = await auth();
        if (!session?.user?.companyId || !session?.user?.id) return { success: false, error: "Unauthorized" };

        const companyInfo = await prisma.company.findUnique({
            where: { id: session.user.companyId },
            select: { name: true }
        });

        // Check if user already exists
        let existing = await prisma.user.findUnique({ where: { email } });

        if (!existing) {
            // User does not exist, create a stub guest account
            existing = await prisma.user.create({
                data: {
                    email,
                    name: email.split("@")[0],
                    // Generate a strong placeholder password hash so they cannot login without reset
                    passwordHash: "pending_invite_" + randomBytes(16).toString("hex"),
                } as any
            });
        }

        // Check if already in company
        const memberCheck = await prisma.companyUser.findUnique({
            where: { userId_companyId: { userId: existing.id, companyId: session.user.companyId } },
        });

        if (memberCheck) return { success: false, error: "Este usuario ya es miembro del equipo." };

        // Add to company
        await prisma.companyUser.create({
            data: {
                userId: existing.id,
                companyId: session.user.companyId,
                role,
                invitedBy: session.user.id,
            } as any,
        });

        // Generate a password reset token for them to verify and set their password
        await prisma.passwordResetToken.updateMany({
            where: { email, used: false },
            data: { used: true },
        });

        const token = randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        await prisma.passwordResetToken.create({
            data: { email, token, expiresAt },
        });

        const resetUrl = `${process.env.NEXTAUTH_URL}/auth/nueva-contrasena?token=${token}`;
        
        // Send email
        await sendEmail({
            to: email,
            subject: `Invitación a unirte a ${companyInfo?.name || "tu equipo"} en LegacyMark`,
            companyId: session.user.companyId,
            html: getInviteEmailHtml({
                companyName: companyInfo?.name || "Tu Empresa",
                resetUrl,
            }),
        });

        revalidatePath("/dashboard/settings/members");
        return { success: true, message: `Invitación enviada exitosamente a ${email}.` };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// ─── EMAIL TEMPLATE ───────────────────────────────────────────────────────────

function getInviteEmailHtml({ companyName, resetUrl }: { companyName: string; resetUrl: string }) {
    return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Invitación a equipo</title>
</head>
<body style="margin:0;padding:0;background:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#1e293b;border-radius:12px;border:1px solid #334155;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.4);">
          <!-- Header -->
          <tr>
            <td style="background:#020617;padding:32px 40px;text-align:center;">
              <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:800;letter-spacing:-0.5px;">LEGACY<span style="color:#14b8a6;">MARK</span></h1>
              <p style="color:#94a3b8;margin:8px 0 0;font-size:13px;letter-spacing:0.05em;">AGENCIA DE MARKETING DIGITAL</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:48px 40px 32px;">
              <h2 style="color:#f8fafc;font-size:24px;font-weight:800;margin:0 0 16px;line-height:1.2;">Te han invitado al Hub</h2>
              <p style="color:#cbd5e1;font-size:15px;line-height:1.6;margin:0 0 32px;">
                Has sido invitado a colaborar en el espacio empresarial de <strong style="color:#38bdf8;">${companyName}</strong> en LegacyMark.
                Haz clic en el botón de abajo para activar tu cuenta y establecer tu contraseña. 
              </p>
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${resetUrl}" style="display:inline-block;background:#0d9488;color:#ffffff;text-decoration:none;padding:16px 40px;border-radius:8px;font-size:15px;font-weight:700;letter-spacing:0.02em;">
                      Aceptar Invitación →
                    </a>
                  </td>
                </tr>
              </table>
              <!-- Security Note -->
              <div style="margin-top:40px;padding:20px;background:#0f172a;border-radius:8px;border-left:4px solid #14b8a6;">
                 <p style="color:#94a3b8;font-size:13px;margin:0;line-height:1.5;">
                  🔑 <strong>Importante:</strong> Este enlace de activación es privado y caduca en 7 días para tu seguridad.
                </p>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function getTeamActivity() {
    try {
        const session = await auth();
        if (!session?.user?.companyId) return { success: false, data: [] };

        const members = await prisma.companyUser.findMany({
            where: { companyId: session.user.companyId },
            include: {
                user: {
                    select: {
                        id: true, firstName: true, lastName: true, email: true, image: true, role: true,
                    },
                },
            },
            orderBy: { joinedAt: "desc" },
        });

        return { success: true, data: members };
    } catch (error: any) {
        return { success: false, data: [], error: error.message };
    }
}

// ═══════════════════════════════════════════════════════════
// SETTINGS HUB — Overview
// ═══════════════════════════════════════════════════════════

export async function getSettingsOverview() {
    try {
        const session = await auth();
        if (!session?.user?.companyId) return { success: false, data: null };

        const [apiKeyCount, webhookCount, memberCount, integrationCount, notificationCount] = await Promise.all([
            prisma.apiKey.count({ where: { companyId: session.user.companyId, isActive: true } }),
            prisma.webhook.count({ where: { companyId: session.user.companyId, isActive: true } }),
            prisma.companyUser.count({ where: { companyId: session.user.companyId } }),
            prisma.integrationConfig.count({ where: { companyId: session.user.companyId, isEnabled: true } }),
            prisma.notificationPreference.count({
                where: { companyId: session.user.companyId, userId: session.user.id!, enabled: true },
            }),
        ]);

        // Recent integration errors
        const integrationErrors = await prisma.integrationLog.findMany({
            where: { companyId: session.user.companyId, status: { in: ["ERROR", "DEGRADED"] } },
            orderBy: { checkedAt: "desc" },
            take: 3,
            distinct: ["integration"],
        });

        // Expiring API keys not supported by basic schema
        const expiringKeys: any[] = [];

        return {
            success: true,
            data: {
                apiKeyCount,
                webhookCount,
                memberCount,
                integrationCount,
                notificationCount,
                integrationErrors,
                expiringKeys,
                alerts: [
                    ...integrationErrors.map(e => ({ type: "error", message: `${e.integration}: ${e.message}` })),
                    ...expiringKeys.map(k => ({ type: "warning", message: `API Key "${k.name}" vence pronto` })),
                ],
            },
        };
    } catch (error: any) {
        return { success: false, data: null, error: error.message };
    }
}

// ═══════════════════════════════════════════════════════════
// CRM AUTOMATION - CRON SECRET CONFIG
// ═══════════════════════════════════════════════════════════

export async function getCronSecret() {
    try {
        const session = await auth();
        if (!session?.user?.companyId) return { success: false, hasSecret: false };
        const config = await prisma.integrationConfig.findFirst({
            where: { companyId: session.user.companyId, provider: "crm_automation" },
        });
        const secret = config?.config ? (config.config as any)?.secretKey : null;
        return { success: true, hasSecret: !!secret, isEnabled: config?.isEnabled ?? false };
    } catch (error: any) {
        return { success: false, hasSecret: false, error: error.message };
    }
}

export async function saveCronSecret(secret: string, isEnabled: boolean) {
    try {
        const session = await auth();
        if (!session?.user?.companyId) return { success: false, error: "Unauthorized" };
        const companyId = session.user.companyId;
        await prisma.integrationConfig.upsert({
            where: { companyId_provider: { companyId, provider: "crm_automation" } },
            update: { config: { secretKey: secret || null }, isEnabled },
            create: { companyId, provider: "crm_automation", config: { secretKey: secret || null }, isEnabled },
        });
        revalidatePath("/dashboard/settings/developer");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}


export async function getChannelConfigs() {
    try {
        const session = await auth();
        if (!session?.user?.id || !session?.user?.companyId) return { success: false, data: [] };
        
        const configs = await prisma.integrationConfig.findMany({
            where: { companyId: session.user.companyId, provider: { in: ['EMAIL_NOTIFICATIONS', 'SLACK_NOTIFICATIONS'] } }
        });
        
        return { success: true, data: configs };
    } catch (e) {
        return { success: false, data: [] };
    }
}

export async function updateChannelConfig(channel: string, value: string) {
    try {
        const session = await auth();
        if (!session?.user?.id || !session?.user?.companyId) return { success: false, error: 'Unauthorized' };
        
        const provider = channel === 'EMAIL' ? 'EMAIL_NOTIFICATIONS' : 'SLACK_NOTIFICATIONS';
        
        await prisma.integrationConfig.upsert({
            where: { companyId_provider: { companyId: session.user.companyId, provider } },
            update: { config: { target: value }, isEnabled: true },
            create: { companyId: session.user.companyId, provider, config: { target: value }, isEnabled: true }
        });
        
        return { success: true };
    } catch (e) {
        return { success: false };
    }
}

export async function getApiUsageLogs() {
    try {
        const session = await auth();
        if (!session?.user?.companyId) return { success: false, data: [] };

        const logs = await prisma.usageLog.findMany({
            where: { companyId: session.user.companyId },
            orderBy: { recordedAt: "desc" },
            take: 50,
        });

        return { success: true, data: logs };
    } catch (error: any) {
        return { success: false, data: [], error: error.message };
    }
}
