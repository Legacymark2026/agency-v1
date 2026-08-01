"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketingService = void 0;
const database_1 = require("@agency/database");
const events_1 = require("@agency/events");
const email_provider_1 = require("./email-provider");
const suppression_service_1 = require("./suppression.service");
const tracking_service_1 = require("./tracking.service");
const block_compiler_service_1 = require("./block-compiler.service");
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const eventBus = new events_1.EventBus(REDIS_URL, "marketing-service");
const providerManager = new email_provider_1.EmailProviderManager();
class MarketingService {
    /**
     * Obtener envíos masivos por empresa
     */
    static async getEmailBlasts(companyId) {
        return database_1.prisma.emailBlast.findMany({
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
    static async createEmailBlast(input) {
        let rawRecipients = input.recipients || [];
        // Si se pasa listId y no hay destinatarios explícitos, cargar los suscriptores de esa lista
        if ((!rawRecipients || rawRecipients.length === 0) && input.listId) {
            try {
                const subs = await database_1.prisma.audienceSubscriber.findMany({
                    where: { listId: input.listId, status: 'SUBSCRIBED', companyId: input.companyId },
                    select: { email: true, name: true, customFields: true }
                });
                if (subs.length > 0) {
                    rawRecipients = subs.map((s) => ({
                        email: s.email,
                        name: s.name || '',
                        variables: s.customFields || {}
                    }));
                }
            }
            catch (err) {
                console.warn('[createEmailBlast] Error cargando suscriptores por listId:', err);
            }
        }
        if (!rawRecipients || rawRecipients.length === 0) {
            throw new Error("El archivo CSV o la lista seleccionada no contenía ninguna dirección de correo electrónico válida. Por favor verifica tu archivo e intenta de nuevo.");
        }
        // Filtrar correos en lista negra (bounces, quejas, desuscripciones)
        let { valid: validRecipients, suppressedCount } = await suppression_service_1.SuppressionService.filterSuppressedRecipients(input.companyId, rawRecipients);
        if (!validRecipients || validRecipients.length === 0) {
            throw new Error(`Todos los ${rawRecipients.length} destinatarios de tu archivo/lista están bloqueados en la lista de supresión/desuscripciones de tu empresa (${suppressedCount} suprimidos).`);
        }
        const isAb = input.isAbTest ?? false;
        // Si se proporciona designJson y no htmlBody, compilar bloques a HTML responsive
        let finalHtmlBody = input.htmlBody || "";
        if (input.designJson && (!finalHtmlBody || finalHtmlBody.trim().length === 0)) {
            try {
                finalHtmlBody = block_compiler_service_1.BlockCompilerService.compileBlocksToHtml(input.designJson);
            }
            catch (err) {
                console.warn("[createEmailBlast] Error compilando designJson a HTML:", err);
            }
        }
        const blast = await database_1.prisma.emailBlast.create({
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
    static async sendEmailBlast(blastId, companyId, baseUrl = "http://localhost:3000") {
        const blast = await database_1.prisma.emailBlast.findFirst({
            where: { id: blastId, companyId },
            include: { recipients: { where: { status: "PENDING" } } }
        });
        if (!blast)
            throw new Error("Campaña de correo no encontrada");
        // Marcar campaña como PROCESSING
        await database_1.prisma.emailBlast.update({
            where: { id: blastId },
            data: { status: "PROCESSING" }
        });
        const recipients = blast.recipients;
        if (!recipients.length) {
            await database_1.prisma.emailBlast.update({
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
            const emailPayloads = chunk.map((r) => {
                const isVariantB = blast.isAbTest && r.variant === "B";
                const rawSubject = isVariantB ? (blast.subjectB || blast.subject) : blast.subject;
                const rawBody = isVariantB ? (blast.htmlBodyB || blast.htmlBody) : blast.htmlBody;
                const trackingPayload = {
                    recipientId: r.id,
                    blastId: blast.id,
                    email: r.email,
                    companyId: blast.companyId
                };
                const trackedHtml = tracking_service_1.TrackingService.injectTracking(rawBody, trackingPayload, baseUrl);
                const unsubscribeHeaders = tracking_service_1.TrackingService.getUnsubscribeHeaders(trackingPayload, baseUrl);
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
                // Actualizar estado de los receptores individualmente según el resultado real
                if (batchResult.results && batchResult.results.length > 0) {
                    for (let idx = 0; idx < chunk.length; idx++) {
                        const recipient = chunk[idx];
                        const itemRes = batchResult.results[idx];
                        if (itemRes && itemRes.status === "SENT") {
                            await database_1.prisma.emailBlastRecipient.update({
                                where: { id: recipient.id },
                                data: { status: "SENT", sentAt: new Date() }
                            });
                        }
                        else {
                            await database_1.prisma.emailBlastRecipient.update({
                                where: { id: recipient.id },
                                data: { status: "FAILED", errorMessage: itemRes?.error || "Error de entrega en el servidor de correo" }
                            });
                        }
                    }
                }
                else {
                    const chunkIds = chunk.map((c) => c.id);
                    await database_1.prisma.emailBlastRecipient.updateMany({
                        where: { id: { in: chunkIds } },
                        data: { status: "SENT", sentAt: new Date() }
                    });
                }
            }
            catch (err) {
                totalFailed += chunk.length;
                const chunkIds = chunk.map((c) => c.id);
                await database_1.prisma.emailBlastRecipient.updateMany({
                    where: { id: { in: chunkIds } },
                    data: { status: "FAILED", errorMessage: err.message || "Error general del proveedor de correo" }
                });
            }
            // Pausa defensiva de 350ms entre lotes para respetar límites de velocidad del proveedor (2 req/s)
            if (i + BATCH_SIZE < recipients.length) {
                await new Promise((resolve) => setTimeout(resolve, 350));
            }
        }
        // Actualizar totales en EmailBlast
        await database_1.prisma.emailBlast.update({
            where: { id: blastId },
            data: {
                status: "COMPLETED",
                sent: { increment: totalSent },
                failed: { increment: totalFailed },
                sentAt: new Date()
            }
        });
        // Publicar evento en el EventBus
        await eventBus.publish("email.blast_completed", {
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
     * Cron Worker para procesar automáticamente campañas programadas (status = 'SCHEDULED' o 'QUEUED')
     */
    static async processScheduledBlasts(baseUrl = "https://app.legacymarksas.com") {
        try {
            const now = new Date();
            const dueBlasts = await database_1.prisma.emailBlast.findMany({
                where: {
                    status: { in: ["SCHEDULED", "QUEUED"] },
                    scheduledAt: { lte: now }
                },
                take: 10
            });
            for (const blast of dueBlasts) {
                console.log(`[processScheduledBlasts] Despachando campaña programada "${blast.name}" (ID: ${blast.id})...`);
                try {
                    await this.sendEmailBlast(blast.id, blast.companyId, baseUrl);
                }
                catch (err) {
                    console.error(`[processScheduledBlasts] Error enviando campaña ${blast.id}:`, err);
                }
            }
        }
        catch (err) {
            console.warn("[processScheduledBlasts] Error buscando campañas programadas:", err);
        }
    }
    /**
     * Obtener un blast específico por ID
     */
    static async getEmailBlast(blastId, companyId) {
        const blast = await database_1.prisma.emailBlast.findFirst({
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
    static async deleteEmailBlast(blastId, companyId) {
        await database_1.prisma.emailBlastRecipient.deleteMany({
            where: { blastId }
        });
        return database_1.prisma.emailBlast.deleteMany({
            where: { id: blastId, companyId }
        });
    }
    /**
     * Eliminar múltiples blasts por IDs
     */
    static async bulkDeleteEmailBlasts(blastIds, companyId) {
        await database_1.prisma.emailBlastRecipient.deleteMany({
            where: { blastId: { in: blastIds } }
        });
        return database_1.prisma.emailBlast.deleteMany({
            where: { id: { in: blastIds }, companyId }
        });
    }
    /**
     * Clonar un blast por ID
     */
    static async cloneEmailBlast(blastId, companyId, createdById) {
        const original = await database_1.prisma.emailBlast.findFirst({
            where: { id: blastId, companyId },
            include: { recipients: true }
        });
        if (!original)
            throw new Error("Campaña no encontrada");
        const cloned = await database_1.prisma.emailBlast.create({
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
                    create: (original.recipients || []).map((r) => ({
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
exports.MarketingService = MarketingService;
//# sourceMappingURL=marketing.service.js.map