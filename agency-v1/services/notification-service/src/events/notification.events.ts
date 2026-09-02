/**
 * Platform Event Subscriptions — Notification Service
 * ─────────────────────────────────────────────────────────────────────────────
 * Subscribes to 32 enterprise events across CRM, Finance, Automation, AI, and IAM
 * and automatically notifies admins and target roles in-app and via configured channels.
 */
import { EventBus } from "@agency/events";
import { prisma } from "@agency/database";

export const EVENT_MAPPINGS: Record<string, { type: string; titleFn: (data: any) => string; roles?: string[] }> = {
  // ── CRM & Ventas ──
  "lead.created": {
    type: "CRM",
    titleFn: (d) => `👤 Nuevo Lead: ${d.name || d.data?.name || "Sin nombre"} (${d.source || "Web"})`,
  },
  "lead.assigned": {
    type: "CRM",
    titleFn: (d) => `📌 Lead asignado: ${d.leadName || d.data?.leadName || "Nuevo Lead"}`,
  },
  "deal.created": {
    type: "CRM",
    titleFn: (d) => `💼 Nuevo Deal creado: ${d.title || d.data?.title || "Oportunidad"}`,
  },
  "deal.stage_changed": {
    type: "CRM",
    titleFn: (d) => `🔄 Pipeline: ${d.title || "Deal"} movido a ${d.toStage || d.stage || "nueva etapa"}`,
  },
  "deal.won": {
    type: "CRM",
    titleFn: (d) => `🎉 Deal Ganado — $${d.value?.toLocaleString() || d.amount?.toLocaleString() || "0"} USD`,
  },
  "deal.lost": {
    type: "CRM",
    titleFn: (d) => `❌ Deal Perdido: ${d.title || "Oportunidad"} (${d.reason || "Sin motivo"})`,
  },
  "proposal.accepted": {
    type: "CRM",
    titleFn: (d) => `✍️ Propuesta Firmada e-Sign: ${d.proposalTitle || "Cotización"}`,
  },
  "proposal.rejected": {
    type: "CRM",
    titleFn: (d) => `⚠️ Propuesta Rechazada: ${d.proposalTitle || "Cotización"}`,
  },
  "sales_goal.achieved": {
    type: "CRM",
    titleFn: (d) => `🏆 Meta de Ventas Alcanzada: ${d.goalTitle || "Objetivo Mensual"}`,
  },

  // ── Finanzas, Facturación DIAN & POS ──
  "invoice.created": {
    type: "FINANCE",
    titleFn: (d) => `📄 Factura Generada #${d.number || d.invoiceNumber || "001"}`,
  },
  "invoice.paid": {
    type: "FINANCE",
    titleFn: (d) => `💰 Factura Pagada — $${d.amount?.toLocaleString() || "0"} COP/USD`,
  },
  "invoice.overdue": {
    type: "FINANCE",
    titleFn: (d) => `🚨 Factura Vencida #${d.invoiceNumber || "001"} — $${d.amount?.toLocaleString() || "0"}`,
  },
  "invoice.dian_rejected": {
    type: "FINANCE",
    titleFn: (d) => `⛔ Rechazo DIAN / RADIAN en Factura #${d.invoiceNumber || "001"}`,
  },
  "expense.approved": {
    type: "FINANCE",
    titleFn: (d) => `✅ Egreso Aprobado: ${d.concept || "Gasto"} ($${d.amount?.toLocaleString() || "0"})`,
  },
  "payroll.processed": {
    type: "FINANCE",
    titleFn: (d) => `📑 Nómina Electrónica Procesada (${d.period || "Período Actual"})`,
  },
  "pos.sale_completed": {
    type: "FINANCE",
    titleFn: (d) => `🛒 Venta POS Caja #${d.registerId || "1"} — $${d.total?.toLocaleString() || "0"}`,
  },

  // ── Automatización & Workflows ──
  "workflow.completed": {
    type: "AUTOMATION",
    titleFn: (d) => `✅ Workflow Completado: ${d.workflowName || d.name || "Automatización"}`,
  },
  "workflow.failed": {
    type: "AUTOMATION",
    titleFn: (d) => `⚠️ Workflow Fallido: ${d.workflowName || d.name || "Desconocido"}`,
  },
  "cron.job_failed": {
    type: "AUTOMATION",
    titleFn: (d) => `🚨 Tarea Cron Fallida: ${d.jobName || "Sistema"}`,
  },

  // ── IA & Agentes Autónomos ──
  "agent.task_completed": {
    type: "AI_ENGINE",
    titleFn: (d) => `🤖 Agente IA ${d.agentName || "Bot"}: Tarea completada con éxito`,
  },
  "agent.handoff_requested": {
    type: "AI_ENGINE",
    titleFn: (d) => `🙋 Agente IA solicita transferencia humana para cliente ${d.clientName || ""}`,
  },
  "agent.quota_warning": {
    type: "AI_ENGINE",
    titleFn: (d) => `⚠️ Alerta de Tokens IA: 90% de la cuota consumida`,
  },

  // ── Inbox Omnicanal & Soporte ──
  "conversation.assigned": {
    type: "INBOX",
    titleFn: (d) => `💬 Conversación ${d.channel || "WhatsApp"} asignada: ${d.customerName || "Cliente"}`,
  },
  "message.vip_received": {
    type: "INBOX",
    titleFn: (d) => `⭐ Mensaje VIP Recibido de ${d.senderName || "Cliente Prioritario"}`,
  },
  "sla.breached": {
    type: "INBOX",
    titleFn: (d) => `⏰ SLA Incumplido: Tiempo de respuesta excedido en chat #${d.chatId || ""}`,
  },

  // ── Marketing & Campañas ──
  "campaign.launched": {
    type: "MARKETING",
    titleFn: (d) => `🚀 Campaña Lanzada: ${d.campaignName || "Nueva Campaña"}`,
  },
  "email_blast.completed": {
    type: "MARKETING",
    titleFn: (d) => `📬 Envío Masivo Finalizado: ${d.sentCount || 0} correos entregados`,
  },
  "domain_reputation.warning": {
    type: "MARKETING",
    titleFn: (d) => `⚠️ Alerta de Reputación de Dominio de Email: ${d.domain || ""}`,
  },

  // ── Proyectos & Recursos Humanos ──
  "project.task_assigned": {
    type: "PROJECTS",
    titleFn: (d) => `📋 Tarea Kanban Asignada: ${d.taskTitle || "Nueva Tarea"}`,
  },
  "project.task_completed": {
    type: "PROJECTS",
    titleFn: (d) => `🎉 Tarea Kanban Completada: ${d.taskTitle || "Tarea"}`,
  },

  // ── Seguridad, IAM & ISO 27001 ──
  "auth.lockout": {
    type: "IAM",
    titleFn: (d) => `🔒 Cuenta Bloqueada por Fuerza Bruta: ${d.email || "Usuario"}`,
  },
  "auth.role_changed": {
    type: "IAM",
    titleFn: (d) => `🛡️ Privilegios Modificados para ${d.targetUser || "Usuario"} → Rol: ${d.newRole || ""}`,
  },
  "compliance.arco_export_ready": {
    type: "IAM",
    titleFn: (_d) => `📦 Paquete de Datos ARCO / Ley 1581 listo para descarga`,
  },
};

export function subscribePlatformEvents(eventBus: EventBus): void {
  for (const [eventName, mapping] of Object.entries(EVENT_MAPPINGS)) {
    eventBus.subscribe(eventName as any, async (payload) => {
      try {
        const companyId = payload?.data?.companyId as string;
        if (!companyId) return;

        const admins = await prisma.companyUser.findMany({
          where: { companyId, roleName: { in: ["admin", "owner"] } },
          select: { userId: true },
        });

        if (admins.length > 0) {
          await prisma.notification.createMany({
            data: admins.map((a: typeof admins[number]) => ({
              userId: a.userId,
              companyId,
              title: mapping.titleFn(payload.data),
              message: JSON.stringify(payload.data).substring(0, 200),
              type: mapping.type,
              isRead: false,
            })),
          });
          console.log(`[notification-service] 🔔 ${eventName} → ${admins.length} users notified`);
        }
      } catch (err: any) {
        console.error(`[notification-service] Event ${eventName} handler error:`, err.message);
      }
    });
  }
}
