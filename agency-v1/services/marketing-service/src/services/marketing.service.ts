import { prisma } from "@agency/database";
import { EventBus } from "@agency/events";
import { EmailProviderManager } from "./email-provider";
import { SuppressionService } from "./suppression.service";
import { TrackingService } from "./tracking.service";
import { BlockCompilerService } from "./block-compiler.service";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const eventBus = new EventBus(REDIS_URL, "marketing-service");
const providerManager = new EmailProviderManager();

export interface CreateEmailBlastInput {
  companyId: string;
  name: string;
  subject: string;
  htmlBody: string;
  designJson?: any;
  isAbTest?: boolean;
  subjectB?: string;
  htmlBodyB?: string;
  fromName?: string;
  fromEmail?: string;
  status?: string;
  scheduledAt?: string | Date;
  totalRecipients?: number;
  createdById?: string;
  recipients?: Array<{ email: string; name?: string; variables?: Record<string, any> }>;
}

export class MarketingService {
  /**
   * Obtener envíos masivos por empresa
   */
  static async getEmailBlasts(companyId: string) {
    return (prisma as any).emailBlast.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        subject: true,
        status: true,
        totalRecipients: true,
        sent: true,
        failed: true,
        opens: true,
        clicks: true,
        sentAt: true,
        createdAt: true,
        createdById: true
      }
    });
  }

  /**
   * Crear campaña masiva filtrando automáticamente destinatarios suprimidos
   */
  static async createEmailBlast(input: CreateEmailBlastInput) {
    let rawRecipients = input.recipients || [];

    // Si se pasa listId y no hay destinatarios explícitos, cargar los suscriptores de esa lista
    if ((!rawRecipients || rawRecipients.length === 0) && (input as any).listId) {
      try {
        const subs = await (prisma as any).audienceSubscriber.findMany({
          where: { listId: (input as any).listId, status: 'SUBSCRIBED', companyId: input.companyId },
          select: { email: true, name: true, customFields: true }
        });
        if (subs.length > 0) {
          rawRecipients = subs.map((s: any) => ({
            email: s.email,
            name: s.name || '',
            variables: s.customFields || {}
          }));
        }
      } catch (err) {
        console.warn('[createEmailBlast] Error cargando suscriptores por listId:', err);
      }
    }
    
    if (!rawRecipients || rawRecipients.length === 0) {
      throw new Error("El archivo CSV o la lista seleccionada no contenía ninguna dirección de correo electrónico válida. Por favor verifica tu archivo e intenta de nuevo.");
    }
    
    // Filtrar correos en lista negra (bounces, quejas, desuscripciones)
    let { valid: validRecipients, suppressedCount } = await SuppressionService.filterSuppressedRecipients(
      input.companyId,
      rawRecipients
    );

    if (!validRecipients || validRecipients.length === 0) {
      throw new Error(`Todos los ${rawRecipients.length} destinatarios de tu archivo/lista están bloqueados en la lista de supresión/desuscripciones de tu empresa (${suppressedCount} suprimidos).`);
    }

    const isAb = input.isAbTest ?? false;

    // Si se proporciona designJson y no htmlBody, compilar bloques a HTML responsive
    let finalHtmlBody = input.htmlBody || "";
    if (input.designJson && (!finalHtmlBody || finalHtmlBody.trim().length === 0)) {
      try {
        finalHtmlBody = BlockCompilerService.compileBlocksToHtml(input.designJson);
      } catch (err) {
        console.warn("[createEmailBlast] Error compilando designJson a HTML:", err);
      }
    }

    const blast = await (prisma as any).emailBlast.create({
      data: {
        name: input.name,
        subject: input.subject,
        htmlBody: finalHtmlBody || "<p>Sin contenido</p>",
        designJson: input.designJson ?? null,
        isAbTest: isAb,
        subjectB: input.subjectB ?? null,
        htmlBodyB: input.htmlBodyB ?? null,
        fromName: input.fromName || "LegacyMark",
        fromEmail: input.fromEmail || "noreply@legacymarksas.com",
        status: input.status || (input.scheduledAt ? "QUEUED" : "DRAFT"),
        scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
        totalRecipients: validRecipients.length,
        companyId: input.companyId,
        createdById: input.createdById || "system",
        recipients: {
          create: validRecipients.map((r, i) => ({
            email: r.email.toLowerCase().trim(),
            name: r.name,
            variant: isAb ? (i % 2 === 0 ? "A" : "B") : "A",
            variables: r.variables || {},
            status: "PENDING"
          }))
        }
      },
      include: { recipients: true }
    });

    return {
      blast,
      suppressedCount
    };
  }

  /**
   * Ejecutar envío de campaña por lotes (Batch Engine con Failover & Tracking)
   */
  static async sendEmailBlast(blastId: string, companyId: string, baseUrl: string = "http://localhost:3000") {
    const blast = await (prisma as any).emailBlast.findFirst({
      where: { id: blastId, companyId },
      include: { recipients: { where: { status: "PENDING" } } }
    });

    if (!blast) throw new Error("Campaña de correo no encontrada");

    // Marcar campaña como PROCESSING
    await (prisma as any).emailBlast.update({
      where: { id: blastId },
      data: { status: "PROCESSING" }
    });

    const recipients = blast.recipients;
    if (!recipients.length) {
      await (prisma as any).emailBlast.update({
        where: { id: blastId },
        data: { status: "COMPLETED", sentAt: new Date() }
      });
      return { success: true, sent: 0, failed: 0 };
    }

    const fromAddress = `${blast.fromName} <${blast.fromEmail}>`;
    let totalSent = 0;
    let totalFailed = 0;

    // Procesar en lotes de 100 correos (Resend Batch API limit)
    const BATCH_SIZE = 100;
    for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
      const chunk = recipients.slice(i, i + BATCH_SIZE);

      const emailPayloads = chunk.map((r: any) => {
        const isVariantB = blast.isAbTest && r.variant === "B";
        const rawSubject = isVariantB ? (blast.subjectB || blast.subject) : blast.subject;
        const rawBody = isVariantB ? (blast.htmlBodyB || blast.htmlBody) : blast.htmlBody;

        const trackingPayload = {
          recipientId: r.id,
          blastId: blast.id,
          email: r.email,
          companyId: blast.companyId
        };

        const trackedHtml = TrackingService.injectTracking(rawBody, trackingPayload, baseUrl);
        const unsubscribeHeaders = TrackingService.getUnsubscribeHeaders(trackingPayload, baseUrl);

        return {
          to: r.email,
          subject: rawSubject,
          html: trackedHtml,
          headers: unsubscribeHeaders
        };
      });

      try {
        const batchResult = await providerManager.sendBatchWithFailover({
          from: fromAddress,
          emails: emailPayloads
        }, companyId);

        totalSent += batchResult.sentCount;
        totalFailed += batchResult.failedCount;

        // Actualizar estado de los receptores
        const chunkIds = chunk.map((c: any) => c.id);
        await (prisma as any).emailBlastRecipient.updateMany({
          where: { id: { in: chunkIds } },
          data: { status: "SENT", sentAt: new Date() }
        });
      } catch (err: any) {
        totalFailed += chunk.length;
        const chunkIds = chunk.map((c: any) => c.id);
        await (prisma as any).emailBlastRecipient.updateMany({
          where: { id: { in: chunkIds } },
          data: { status: "FAILED", errorMessage: err.message }
        });
      }
    }

    // Actualizar totales en EmailBlast
    await (prisma as any).emailBlast.update({
      where: { id: blastId },
      data: {
        status: "COMPLETED",
        sent: { increment: totalSent },
        failed: { increment: totalFailed },
        sentAt: new Date()
      }
    });

    // Publicar evento en el EventBus
    await eventBus.publish("email.blast_completed" as any, {
      blastId,
      companyId,
      sent: totalSent,
      failed: totalFailed,
      timestamp: new Date().toISOString()
    });

    return {
      success: true,
      sent: totalSent,
      failed: totalFailed
    };
  }

  /**
   * Obtener un blast específico por ID
   */
  static async getEmailBlast(blastId: string, companyId: string) {
    const blast = await (prisma as any).emailBlast.findFirst({
      where: { id: blastId, companyId },
      include: {
        recipients: true
      }
    });
    return blast;
  }

  /**
   * Eliminar un blast por ID
   */
  static async deleteEmailBlast(blastId: string, companyId: string) {
    await (prisma as any).emailBlastRecipient.deleteMany({
      where: { blastId }
    });
    return (prisma as any).emailBlast.deleteMany({
      where: { id: blastId, companyId }
    });
  }

  /**
   * Eliminar múltiples blasts por IDs
   */
  static async bulkDeleteEmailBlasts(blastIds: string[], companyId: string) {
    await (prisma as any).emailBlastRecipient.deleteMany({
      where: { blastId: { in: blastIds } }
    });
    return (prisma as any).emailBlast.deleteMany({
      where: { id: { in: blastIds }, companyId }
    });
  }

  /**
   * Clonar un blast por ID
   */
  static async cloneEmailBlast(blastId: string, companyId: string, createdById: string) {
    const original = await (prisma as any).emailBlast.findFirst({
      where: { id: blastId, companyId },
      include: { recipients: true }
    });
    if (!original) throw new Error("Campaña no encontrada");

    const cloned = await (prisma as any).emailBlast.create({
      data: {
        name: `${original.name} (Copia)`,
        subject: original.subject,
        htmlBody: original.htmlBody,
        designJson: original.designJson,
        isAbTest: original.isAbTest,
        subjectB: original.subjectB,
        fromName: original.fromName,
        fromEmail: original.fromEmail,
        status: "DRAFT",
        totalRecipients: original.recipients?.length || 0,
        companyId,
        createdById: createdById || original.createdById,
        recipients: {
          create: (original.recipients || []).map((r: any) => ({
            email: r.email,
            name: r.name,
            variant: r.variant || "A",
            variables: r.variables || {},
            status: "PENDING"
          }))
        }
      },
      include: { recipients: true }
    });
    return cloned;
  }
}
