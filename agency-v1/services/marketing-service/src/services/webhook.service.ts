import { prisma } from "@agency/database";
import { SuppressionService } from "./suppression.service";

export interface WebhookEventPayload {
  type: string; // email.delivered, email.opened, email.clicked, email.bounced, email.complained
  data?: {
    email_id?: string;
    recipient?: string;
    email?: string;
    blast_id?: string;
    company_id?: string;
    created_at?: string;
    click_url?: string;
    bounce_type?: string;
    reason?: string;
  };
}

export class WebhookService {
  /**
   * Procesar webhook entrante de entregabilidad
   */
  static async handleWebhookEvent(event: WebhookEventPayload): Promise<{ success: boolean; message: string }> {
    const eventType = event.type;
    const recipientEmail = (event.data?.recipient || event.data?.email || "").toLowerCase().trim();
    const blastId = event.data?.blast_id;
    const companyId = event.data?.company_id;

    if (!recipientEmail) {
      return { success: false, message: "No recipient email found in webhook event" };
    }

    // Buscar el destinatario correspondiente
    const recipient = await (prisma as any).emailBlastRecipient.findFirst({
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
        await (prisma as any).emailBlastRecipient.update({
          where: { id: recipient.id },
          data: { status: "DELIVERED", sentAt: recipient.sentAt || new Date() }
        });
        break;
      }

      case "email.opened": {
        if (!recipient.openedAt) {
          await prisma.$transaction([
            (prisma as any).emailBlastRecipient.update({
              where: { id: recipient.id },
              data: { openedAt: new Date(), status: "OPENED" }
            }),
            (prisma as any).emailBlast.update({
              where: { id: recipient.blastId },
              data: { opens: { increment: 1 } }
            })
          ]);
        }
        break;
      }

      case "email.clicked": {
        const isFirstClick = !recipient.clickedAt;
        await prisma.$transaction([
          (prisma as any).emailBlastRecipient.update({
            where: { id: recipient.id },
            data: {
              clickedAt: new Date(),
              openedAt: recipient.openedAt || new Date(),
              status: "CLICKED"
            }
          }),
          (prisma as any).emailBlast.update({
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
        await prisma.$transaction([
          (prisma as any).emailBlastRecipient.update({
            where: { id: recipient.id },
            data: {
              bouncedAt: new Date(),
              status: "FAILED",
              errorMessage: `Rebote detectado: ${reason}`
            }
          }),
          (prisma as any).emailBlast.update({
            where: { id: recipient.blastId },
            data: { failed: { increment: 1 } }
          })
        ]);

        // Auto-agregar a lista de supresión
        await SuppressionService.addToSuppression(currentCompanyId, recipientEmail, `Bounced: ${reason}`);
        break;
      }

      case "email.complained": {
        await prisma.$transaction([
          (prisma as any).emailBlastRecipient.update({
            where: { id: recipient.id },
            data: {
              complainedAt: new Date(),
              status: "COMPLAINED",
              errorMessage: "Reportado como Spam por el usuario"
            }
          }),
          (prisma as any).emailBlast.update({
            where: { id: recipient.blastId },
            data: { failed: { increment: 1 } }
          })
        ]);

        // Auto-agregar a lista de supresión por queja de spam
        await SuppressionService.addToSuppression(currentCompanyId, recipientEmail, "Spam Complaint");
        break;
      }

      default:
        console.log(`[webhook-service] Unhandled event type: ${eventType}`);
    }

    return { success: true, message: `Event ${eventType} processed for ${recipientEmail}` };
  }
}
