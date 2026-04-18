import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";

// ──────────────────────────────────────────────────────────────────────────────
// Tool 1: Update Deal Stage (Existente)
// ──────────────────────────────────────────────────────────────────────────────
export const updateDealStageTool = {
    description: "Actualiza la etapa de un negocio (Deal) en el CRM.",
    parameters: z.object({
        dealId: z.string().uuid().describe("El ID único del trato/negocio en la base de datos."),
        newStage: z.enum(["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL", "NEGOTIATION", "WON", "LOST"]).describe("La nueva etapa del embudo a asignar."),
        reason: z.string().optional().describe("Razón opcional del cambio, útil cuando se marca como LOST."),
    }),
    execute: async ({ dealId, newStage, reason }: { dealId: string; newStage: string; reason?: string }) => {
        try {
            const updatedDeal = await prisma.deal.update({
                where: { id: dealId },
                data: { stage: newStage },
            });
            return {
                success: true,
                message: `El trato '${updatedDeal.title}' ha sido movido a la etapa ${newStage}.`,
                deal: updatedDeal,
            };
        } catch (error: any) {
            return { success: false, error: "No se pudo actualizar el trato en Prisma: " + error.message };
        }
    },
};

// ──────────────────────────────────────────────────────────────────────────────
// Tool 2: Create Invoice (Existente)
// ──────────────────────────────────────────────────────────────────────────────
export const createInvoiceTool = {
    description: "Crea una factura real en la base de datos aplicando la regla del 60/40 de la agencia.",
    parameters: z.object({
        clientName: z.string().describe("Nombre del cliente o empresa."),
        totalAmount: z.number().describe("Monto total del proyecto (100%)."),
        description: z.string().describe("Servicio contratado (Ej: Desarrollo Web Avanzado)."),
    }),
    execute: async ({ clientName, totalAmount, description, companyId }: { clientName: string; totalAmount: number; description: string; companyId?: string }) => {
        if (!companyId) return { success: false, error: "Falta el ID de compañía." };
        const advancePayment = totalAmount * 0.6;
        const finalPayment = totalAmount * 0.4;
        try {
            const invoice = await prisma.invoice.create({
                data: {
                    clientName,
                    serviceDescription: description,
                    totalAmount,
                    advanceAmount: advancePayment,
                    finalAmount: finalPayment,
                    status: "DRAFT_AWAITING_PAYMENT",
                    companyId
                }
            });
            return {
                success: true,
                action: "Factura Generada y Guardada en Base de Datos",
                summary: `Cliente: ${clientName} | Total: $${totalAmount} | Anticipo 60%: $${advancePayment} | Final 40%: $${finalPayment}`,
                data: invoice
            };
        } catch (error: any) {
            return { success: false, error: "Fallo al guardar factura: " + error.message };
        }
    },
};

// ──────────────────────────────────────────────────────────────────────────────
// Tool 3: Search CRM Deals (Existente)
// ──────────────────────────────────────────────────────────────────────────────
export const getCRMDealsTool = {
    description: "Busca tratos (deals) activos en el CRM de la compañía basándose en una palabra clave.",
    parameters: z.object({
        searchQuery: z.string().describe("Palabra clave para buscar clientes o títulos de tratos."),
        companyId: z.string().optional().describe("ID de la compañía a filtrar (usualmente inyectado por auth)."),
    }),
    execute: async ({ searchQuery, companyId }: { searchQuery: string; companyId?: string }) => {
        if (!companyId) return { success: false, error: "Falta el ID de compañía." };
        const deals = await prisma.deal.findMany({
            where: {
                companyId,
                title: { contains: searchQuery, mode: 'insensitive' }
            },
            take: 5,
            select: { id: true, title: true, value: true, stage: true }
        });
        return { success: true, count: deals.length, deals };
    }
};

// ──────────────────────────────────────────────────────────────────────────────
// Tool 4: NEW — Send Follow-Up Email via Resend
// ──────────────────────────────────────────────────────────────────────────────
export const sendFollowUpEmailTool = {
    description: "Envía un email de seguimiento profesional a un lead o cliente del CRM usando Resend. Busca el lead por nombre o email. Úsala cuando el usuario diga 'envía un email a...' o 'manda un seguimiento a...'.",
    parameters: z.object({
        recipientEmail: z.string().email().describe("Email del destinatario."),
        recipientName: z.string().describe("Nombre del destinatario para personalizar el mensaje."),
        subject: z.string().describe("Asunto del email."),
        messageBody: z.string().describe("Cuerpo del email en texto plano o HTML básico. Sé profesional y conciso."),
        senderName: z.string().optional().describe("Nombre del remitente (default: LegacyMark)."),
    }),
    execute: async ({ recipientEmail, recipientName, subject, messageBody, senderName }: {
        recipientEmail: string;
        recipientName: string;
        subject: string;
        messageBody: string;
        senderName?: string;
    }) => {
        const resendKey = process.env.RESEND_API_KEY;
        if (!resendKey) {
            return { success: false, error: "RESEND_API_KEY no configurada en el servidor. Pídele al administrador que la agregue al .env." };
        }

        const resend = new Resend(resendKey);
        const fromName = senderName || "LegacyMark";

        const htmlBody = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; color: #1e293b;">
                <div style="background: #0f172a; padding: 24px; border-radius: 12px 12px 0 0;">
                    <h2 style="color: #14b8a6; margin: 0; font-size: 18px;">LegacyMark</h2>
                    <p style="color: #94a3b8; margin: 4px 0 0; font-size: 12px;">Agencia Digital de Alto Nivel</p>
                </div>
                <div style="background: #f8fafc; padding: 32px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0;">
                    <p style="margin-top: 0;">Estimado/a <strong>${recipientName}</strong>,</p>
                    <div style="white-space: pre-wrap; line-height: 1.6;">${messageBody}</div>
                    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
                    <p style="color: #64748b; font-size: 13px; margin: 0;">
                        ${fromName} · LegacyMark<br/>
                        <a href="https://legacymark.com" style="color: #14b8a6;">legacymark.com</a>
                    </p>
                </div>
            </div>
        `;

        try {
            const result = await resend.emails.send({
                from: `${fromName} <noreply@legacymark.com>`,
                to: recipientEmail,
                subject,
                html: htmlBody,
            });

            if (result.error) {
                return { success: false, error: "Resend rechazó el email: " + result.error.message };
            }

            return {
                success: true,
                message: `Email enviado exitosamente a ${recipientName} (${recipientEmail}).`,
                emailId: result.data?.id,
            };
        } catch (err: any) {
            return { success: false, error: "Error al enviar email: " + err.message };
        }
    },
};

// ──────────────────────────────────────────────────────────────────────────────
// Tool 5: NEW — Schedule Meeting / Create Calendar Event
// ──────────────────────────────────────────────────────────────────────────────
export const scheduleMeetingTool = {
    description: "Crea una cita o reunión en el Calendario del panel. Úsala cuando el usuario diga 'agenda una reunión', 'crea un evento', 'programa una llamada', etc.",
    parameters: z.object({
        title: z.string().describe("Título de la reunión (Ej: 'Llamada de Cierre con Constructora ABC')."),
        startDateTime: z.string().describe("Fecha y hora de inicio en formato ISO 8601 (Ej: '2025-04-01T15:00:00')."),
        endDateTime: z.string().describe("Fecha y hora de fin en formato ISO 8601 (Ej: '2025-04-01T16:00:00')."),
        description: z.string().optional().describe("Descripción o agenda de la reunión."),
        leadName: z.string().optional().describe("Nombre del cliente o lead con quien es la reunión."),
    }),
    execute: async ({ title, startDateTime, endDateTime, description, leadName, companyId, userId }: {
        title: string;
        startDateTime: string;
        endDateTime: string;
        description?: string;
        leadName?: string;
        companyId?: string;
        userId?: string;
    }) => {
        if (!companyId || !userId) {
            return { success: false, error: "Falta el contexto de autenticación (companyId/userId)." };
        }

        try {
            const event = await prisma.event.create({
                data: {
                    title,
                    description: description || (leadName ? `Reunión con ${leadName}` : "Creado por Agente IA"),
                    startDate: new Date(startDateTime),
                    endDate: new Date(endDateTime),
                    type: "MEETING",
                    status: "SCHEDULED",
                    organizerId: userId,
                    companyId,
                }
            });

            return {
                success: true,
                message: `Reunión "${title}" agendada para el ${new Date(startDateTime).toLocaleString('es-MX')}.`,
                eventId: event.id,
            };
        } catch (err: any) {
            return { success: false, error: "No se pudo crear el evento: " + err.message };
        }
    },
};

// ──────────────────────────────────────────────────────────────────────────────
// Tool 6: NEW — Send WhatsApp Alert via Meta Cloud API
// ──────────────────────────────────────────────────────────────────────────────
export const sendWhatsAppAlertTool = {
    description: "Envía un mensaje de WhatsApp a un cliente o lead. Úsala cuando el usuario diga 'envía un WhatsApp a...', 'manda un mensaje de WhatsApp', 'notifica por WhatsApp a...'. Requiere número de teléfono con código de país.",
    parameters: z.object({
        phoneNumber: z.string().describe("Número de teléfono con código de país, sin '+' ni espacios (Ej: '528112345678' para México)."),
        recipientName: z.string().describe("Nombre del destinatario."),
        message: z.string().describe("Texto del mensaje a enviar. Máx 1000 caracteres."),
    }),
    execute: async ({ phoneNumber, recipientName, message }: {
        phoneNumber: string;
        recipientName: string;
        message: string;
    }) => {
        const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
        const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

        if (!accessToken || !phoneNumberId) {
            return {
                success: false,
                error: "WHATSAPP_ACCESS_TOKEN y/o WHATSAPP_PHONE_NUMBER_ID no están configurados en el .env del servidor."
            };
        }

        try {
            const response = await fetch(
                `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        messaging_product: "whatsapp",
                        to: phoneNumber,
                        type: "text",
                        text: { body: message },
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                return { success: false, error: `Meta API error: ${data?.error?.message || 'Error desconocido'}` };
            }

            return {
                success: true,
                message: `WhatsApp enviado exitosamente a ${recipientName} (${phoneNumber}).`,
                messageId: data?.messages?.[0]?.id,
            };
        } catch (err: any) {
            return { success: false, error: "Error al conectar con Meta WhatsApp API: " + err.message };
        }
    },
};

// ──────────────────────────────────────────────────────────────────────────────
// Tool 7: NEW — Generate Sales Report
// ──────────────────────────────────────────────────────────────────────────────
export const generateSalesReportTool = {
    description: "Genera un reporte completo de ventas del mes actual o del mes especificado. Incluye deals ganados, ingresos totales, promedio por trato, y progreso vs objetivo mensual. Úsala cuando se pida 'reporte de ventas', 'cómo vamos este mes', 'resumen de ventas'.",
    parameters: z.object({
        month: z.number().min(1).max(12).optional().describe("Mes a reportar (1-12). Si no se especifica, usa el mes actual."),
        year: z.number().optional().describe("Año a reportar. Si no se especifica, usa el año actual."),
    }),
    execute: async ({ month, year, companyId }: { month?: number; year?: number; companyId?: string }) => {
        if (!companyId) return { success: false, error: "Falta el ID de compañía." };

        const now = new Date();
        const targetMonth = (month ?? now.getMonth() + 1) - 1; // 0-indexed
        const targetYear = year ?? now.getFullYear();

        const startDate = new Date(targetYear, targetMonth, 1);
        const endDate = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59);

        const monthNames = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

        try {
            const [wonDeals, allDeals, monthlyTarget] = await Promise.all([
                prisma.deal.findMany({
                    where: {
                        companyId,
                        stage: "WON",
                        updatedAt: { gte: startDate, lte: endDate }
                    },
                    select: { id: true, title: true, value: true, updatedAt: true }
                }),
                prisma.deal.count({ where: { companyId, createdAt: { gte: startDate, lte: endDate } } }),
                Promise.resolve(Number(process.env.MONTHLY_SALES_TARGET || 50000)),
            ]);

            const totalRevenue = wonDeals.reduce((sum, d) => sum + (d.value || 0), 0);
            const avgDealValue = wonDeals.length > 0 ? totalRevenue / wonDeals.length : 0;
            const progressPct = monthlyTarget > 0 ? ((totalRevenue / monthlyTarget) * 100).toFixed(1) : "N/A";

            return {
                success: true,
                report: {
                    period: `${monthNames[targetMonth]} ${targetYear}`,
                    dealsWon: wonDeals.length,
                    totalDealsCreated: allDeals,
                    totalRevenue: `$${totalRevenue.toLocaleString('es-MX')}`,
                    avgDealValue: `$${avgDealValue.toFixed(0)}`,
                    monthlyTarget: `$${monthlyTarget.toLocaleString('es-MX')}`,
                    progressVsTarget: `${progressPct}%`,
                    topDeals: wonDeals.slice(0, 3).map(d => ({ title: d.title, value: `$${d.value}` })),
                },
            };
        } catch (err: any) {
            return { success: false, error: "Error al generar reporte: " + err.message };
        }
    },
};
