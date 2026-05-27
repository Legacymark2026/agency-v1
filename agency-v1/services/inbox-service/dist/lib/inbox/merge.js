"use strict";
/**
 * Conversation Merge (P1 #9)
 *
 * Combine duplicate or related conversations:
 * - Merge messages from secondary to primary
 * - Preserve metadata from both
 * - Audit trail for merge operation
 * - Cascade delete secondary
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeConversations = mergeConversations;
exports.findDuplicateConversations = findDuplicateConversations;
const database_1 = require("@agency/database");
const logger_1 = require("./logger");
const audit_1 = require("./audit");
/**
 * Fusiona dos conversaciones en una
 */
async function mergeConversations(primaryId, secondaryId, companyId, userId) {
    try {
        // Validar que ambas conversaciones existen y pertenecen a la misma compañía
        const [primary, secondary] = await Promise.all([
            database_1.prisma.conversation.findUnique({ where: { id: primaryId } }),
            database_1.prisma.conversation.findUnique({ where: { id: secondaryId } }),
        ]);
        if (!primary || !secondary) {
            throw new Error("Una o ambas conversaciones no existen");
        }
        if (primary.companyId !== companyId || secondary.companyId !== companyId) {
            throw new Error("Las conversaciones no pertenecen a la misma compañía");
        }
        // Mover mensajes de secondary a primary
        await database_1.prisma.message.updateMany({
            where: { conversationId: secondaryId },
            data: { conversationId: primaryId },
        });
        // Mover drafts
        await database_1.prisma.messageDraft.updateMany({
            where: { conversationId: secondaryId },
            data: { conversationId: primaryId },
        });
        // Mover tag assignments
        await database_1.prisma.inboxTagAssignment.updateMany({
            where: { conversationId: secondaryId },
            data: { conversationId: primaryId },
        });
        // Mover audit logs
        await database_1.prisma.inboxAuditLog.updateMany({
            where: { conversationId: secondaryId },
            data: { conversationId: primaryId },
        });
        // Merge metadata
        const mergedMetadata = {
            ...(primary.metadata || {}),
            ...(secondary.metadata || {}),
            merged_from: secondaryId,
            merged_at: new Date().toISOString(),
        };
        // Merge tags
        const mergedTags = Array.from(new Set([...(primary.tags || []), ...(secondary.tags || [])]));
        // Actualizar primary
        await database_1.prisma.conversation.update({
            where: { id: primaryId },
            data: {
                tags: mergedTags,
                metadata: mergedMetadata,
                lastMessageAt: new Date(),
            },
        });
        // Eliminar secondary
        await database_1.prisma.conversation.delete({
            where: { id: secondaryId },
        });
        // Audit
        await (0, audit_1.logAuditEvent)("thread_merged", {
            conversationId: primaryId,
            companyId,
            userId,
            resourceType: "conversation",
            resourceId: primaryId,
            newValue: { mergedFrom: secondaryId },
            metadata: {
                primaryId,
                secondaryId,
            },
        });
        logger_1.logger.info("[Merge] Conversations merged successfully", {
            primaryId,
            secondaryId,
            companyId,
        });
        return true;
    }
    catch (error) {
        logger_1.logger.error("[Merge] Error merging conversations", {
            primaryId,
            secondaryId,
            error: error instanceof Error ? error.message : String(error),
        });
        throw error;
    }
}
/**
 * Detecta conversaciones duplicadas basadas en lead + channel
 */
async function findDuplicateConversations(leadId, channel, companyId) {
    try {
        const conversations = await database_1.prisma.conversation.findMany({
            where: {
                leadId,
                channel,
                companyId,
                status: { not: "CLOSED" },
            },
            orderBy: { lastMessageAt: "desc" },
            take: 10,
        });
        if (conversations.length <= 1)
            return [];
        // Retornar todas excepto la más reciente
        return conversations.slice(1);
    }
    catch (error) {
        logger_1.logger.error("[Merge] Error finding duplicates", {
            leadId,
            channel,
            error: error instanceof Error ? error.message : String(error),
        });
        return [];
    }
}
//# sourceMappingURL=merge.js.map