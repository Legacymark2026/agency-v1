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

        // Create new with same name
        const rawKey = `lm_live_${randomBytes(32).toString("hex")}`;
        const keyHash = createHash("sha256").update(rawKey).digest("hex");

        await prisma.apiKey.create({
            data: {
                name: existing.name,
                keyHash,
                companyId: existing.companyId,
                userId: session.user.id!,
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
    { key: "NEW_LEAD", label: "Nuevo Lead", group: "CRM" },
    { key: "DEAL_WON", label: "Negocio Ganado", group: "CRM" },
    { key: "DEAL_LOST", label: "Negocio Perdido", group: "CRM" },
    { key: "PROPOSAL_VIEWED", label: "Cotización Vista", group: "Ventas" },
    { key: "PROPOSAL_SIGNED", label: "Cotización Firmada", group: "Ventas" },
    { key: "PROPOSAL_REJECTED", label: "Cotización Rechazada", group: "Ventas" },
    { key: "PAYMENT_RECEIVED", label: "Pago Recibido", group: "Finanzas" },
    { key: "PAYROLL_DUE", label: "Nómina por Vencer", group: "Finanzas" },
    { key: "INVOICE_OVERDUE", label: "Factura Vencida", group: "Finanzas" },
    { key: "EXPENSE_PENDING", label: "Egreso Pendiente Aprobación", group: "Finanzas" },
    { key: "NEW_CONVERSATION", label: "Nueva Conversación", group: "Inbox" },
    { key: "MENTION", label: "Mención en Comentario", group: "Inbox" },
    { key: "MESSAGE_RECEIVED", label: "Mensaje Directo", group: "Inbox" },
    { key: "TASK_ASSIGNED", label: "Tarea Asignada", group: "Operaciones" },
    { key: "TASK_COMPLETED", label: "Tarea Completada", group: "Operaciones" },
    { key: "TIME_OFF_REQUESTED", label: "Permiso Ausencia Solicitado", group: "RRHH" },
    { key: "TIME_OFF_APPROVED", label: "Permiso Ausencia Aprobado", group: "RRHH" },
    { key: "SLA_BREACH", label: "SLA Incumplido", group: "Soporte" },
    { key: "CAMPAIGN_LAUNCHED", label: "Campaña Lanzada", group: "Marketing" },
    { key: "AUTOMATION_ERROR", label: "Error en Automatización", group: "Marketing" },
    { key: "MEMBER_JOINED", label: "Nuevo Miembro del Equipo", group: "Equipo" },
    { key: "SYSTEM_ALERT", label: "Alerta del Sistema", group: "Sistema" },
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

        // Read from real IntegrationConfig table instead of empty IntegrationLog
        const configs = await prisma.integrationConfig.findMany({
            where: { companyId: session.user.companyId },
            select: { provider: true, isEnabled: true }
        });

        const configMap = new Map(configs.map(c => [c.provider, c]));

        // All known providers in the platform
        const ALL_PROVIDERS = [
            'facebook-pixel', 'tiktok-pixel', 'linkedin-insight', 'google-analytics',
            'google-tag-manager', 'google-ads', 'hotjar', 'whatsapp',
            'facebook', 'instagram', 'gemini',
            // New integration card names (not yet configured)
            'HUBSPOT', 'MAILCHIMP', 'TWILIO', 'SLACK', 'RESEND',
            'OPENAI', 'ZAPIER', 'AWS_S3', 'ZOHO', 'DYNAMICS365',
        ];

        const result = ALL_PROVIDERS.map(key => {
            const config = configMap.get(key);
            return {
                key,
                status: config ? (config.isEnabled ? 'OK' : 'DEGRADED') : 'UNCONFIGURED',
                checkedAt: new Date(),
                message: config ? (config.isEnabled ? 'Conectada y activa' : 'Configurada pero desactivada') : null,
                latencyMs: null
            };
        });

        return { success: true, data: result };
    } catch (error: any) {
        return { success: false, data: [], error: error.message };
    }
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

        // In a real app this would come from Stripe
        // For now return from company settings/DB
        const company = await prisma.company.findUnique({
            where: { id: session.user.companyId },
            select: { defaultCompanySettings: true, name: true },
        });

        // Mock invoices that would come from Stripe
        const invoices = [
            { id: "inv_001", date: new Date(), amount: 4900, currency: "USD", status: "PAID", downloadUrl: "#" },
            { id: "inv_002", date: new Date(Date.now() - 30 * 86400000), amount: 4900, currency: "USD", status: "PAID", downloadUrl: "#" },
            { id: "inv_003", date: new Date(Date.now() - 60 * 86400000), amount: 4900, currency: "USD", status: "PAID", downloadUrl: "#" },
        ];

        return { success: true, data: invoices, company };
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
                    role: "guest",
                    name: email.split("@")[0],
                    // Generate a strong placeholder password hash so they cannot login without reset
                    passwordHash: "pending_invite_" + randomBytes(16).toString("hex"),
                }
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
            },
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
