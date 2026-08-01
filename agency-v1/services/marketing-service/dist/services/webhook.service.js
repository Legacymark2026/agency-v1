"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookService = void 0;
const database_1 = require("@agency/database");
const suppression_service_1 = require("./suppression.service");
class WebhookService {
    /**
     * Procesar webhook entrante de entregabilidad
     */
    static async handleWebhookEvent(event) {
        const eventType = event.type;
        const recipientEmail = (event.data?.recipient || event.data?.email || "").toLowerCase().trim();
        const blastId = event.data?.blast_id;
        const companyId = event.data?.company_id;
        if (!recipientEmail) {
            return { success: false, message: "No recipient email found in webhook event" };
        }
        // Buscar el destinatario correspondiente
        const recipient = await database_1.prisma.emailBlastRecipient.findFirst({
            where: {
                email: recipientEmail,
                ...(blastId ? { blastId } : {})
            },
            include: { blast: true }
        });
        if (!recipient) {
            return { success: true, message: "Recipient record not found, webhook acknowledged" };
        }
        const currentCompanyId = recipient.blast?.companyId || companyId || "default";
        switch (eventType) {
            case "email.delivered": {
                await database_1.prisma.emailBlastRecipient.update({
                    where: { id: recipient.id },
                    data: { status: "DELIVERED", sentAt: recipient.sentAt || new Date() }
                });
                break;
            }
            case "email.opened": {
                if (!recipient.openedAt) {
                    await database_1.prisma.$transaction([
                        database_1.prisma.emailBlastRecipient.update({
                            where: { id: recipient.id },
                            data: { openedAt: new Date(), status: "OPENED" }
                        }),
                        database_1.prisma.emailBlast.update({
                            where: { id: recipient.blastId },
                            data: { opens: { increment: 1 } }
                        })
                    ]);
                }
                break;
            }
            case "email.clicked": {
                const isFirstClick = !recipient.clickedAt;
                await database_1.prisma.$transaction([
                    database_1.prisma.emailBlastRecipient.update({
                        where: { id: recipient.id },
                        data: {
                            clickedAt: new Date(),
                            openedAt: recipient.openedAt || new Date(),
                            status: "CLICKED"
                        }
                    }),
                    database_1.prisma.emailBlast.update({
                        where: { id: recipient.blastId },
                        data: {
                            clicks: { increment: 1 },
                            ...(isFirstClick && !recipient.openedAt ? { opens: { increment: 1 } } : {})
                        }
                    })
                ]);
                break;
            }
            case "email.bounced": {
                const reason = event.data?.bounce_type || event.data?.reason || "Hard Bounce";
                await database_1.prisma.$transaction([
                    database_1.prisma.emailBlastRecipient.update({
                        where: { id: recipient.id },
                        data: {
                            bouncedAt: new Date(),
                            status: "FAILED",
                            errorMessage: `Rebote detectado: ${reason}`
                        }
                    }),
                    database_1.prisma.emailBlast.update({
                        where: { id: recipient.blastId },
                        data: { failed: { increment: 1 } }
                    })
                ]);
                // Auto-agregar a lista de supresión
                await suppression_service_1.SuppressionService.addToSuppression(currentCompanyId, recipientEmail, `Bounced: ${reason}`);
                break;
            }
            case "email.complained": {
                await database_1.prisma.$transaction([
                    database_1.prisma.emailBlastRecipient.update({
                        where: { id: recipient.id },
                        data: {
                            complainedAt: new Date(),
                            status: "COMPLAINED",
                            errorMessage: "Reportado como Spam por el usuario"
                        }
                    }),
                    database_1.prisma.emailBlast.update({
                        where: { id: recipient.blastId },
                        data: { failed: { increment: 1 } }
                    })
                ]);
                // Auto-agregar a lista de supresión por queja de spam
                await suppression_service_1.SuppressionService.addToSuppression(currentCompanyId, recipientEmail, "Spam Complaint");
                break;
            }
            default:
                console.log(`[webhook-service] Unhandled event type: ${eventType}`);
        }
        return { success: true, message: `Event ${eventType} processed for ${recipientEmail}` };
    }
}
exports.WebhookService = WebhookService;
//# sourceMappingURL=webhook.service.js.map