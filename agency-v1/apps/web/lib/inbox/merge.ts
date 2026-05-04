/**
 * lib/inbox/merge.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Conversation Merge (P1 #9)
 *
 * Combine duplicate or related conversations:
 * - Merge messages from secondary to primary
 * - Preserve metadata from both
 * - Audit trail for merge operation
 * - Cascade delete secondary
 */

import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { logAuditEvent } from "./audit";

/**
 * Fusiona dos conversaciones en una
 */
export async function mergeConversations(
  primaryId: string,
  secondaryId: string,
  companyId: string,
  userId: string
): Promise<boolean> {
  try {
    // Validar que ambas conversaciones existen y pertenecen a la misma compañía
    const [primary, secondary] = await Promise.all([
      prisma.conversation.findUnique({ where: { id: primaryId } }),
      prisma.conversation.findUnique({ where: { id: secondaryId } }),
    ]);

    if (!primary || !secondary) {
      throw new Error("Una o ambas conversaciones no existen");
    }

    if (primary.companyId !== companyId || secondary.companyId !== companyId) {
      throw new Error("Las conversaciones no pertenecen a la misma compañía");
    }

    // Mover mensajes de secondary a primary
    await prisma.message.updateMany({
      where: { conversationId: secondaryId },
      data: { conversationId: primaryId },
    });

    // Mover drafts
    await prisma.messageDraft.updateMany({
      where: { conversationId: secondaryId },
      data: { conversationId: primaryId },
    });

    // Mover tag assignments
    await prisma.inboxTagAssignment.updateMany({
      where: { conversationId: secondaryId },
      data: { conversationId: primaryId },
    });

    // Mover audit logs
    await prisma.inboxAuditLog.updateMany({
      where: { conversationId: secondaryId },
      data: { conversationId: primaryId },
    });

    // Merge metadata
    const mergedMetadata = {
      ...((primary.metadata as any) || {}),
      ...((secondary.metadata as any) || {}),
      merged_from: secondaryId,
      merged_at: new Date().toISOString(),
    };

    // Merge tags
    const mergedTags = Array.from(
      new Set([...(primary.tags || []), ...(secondary.tags || [])])
    );

    // Actualizar primary
    await prisma.conversation.update({
      where: { id: primaryId },
      data: {
        tags: mergedTags,
        metadata: mergedMetadata,
        lastMessageAt: new Date(),
      },
    });

    // Eliminar secondary
    await prisma.conversation.delete({
      where: { id: secondaryId },
    });

    // Audit
    await logAuditEvent("thread_merged", {
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

    logger.info("[Merge] Conversations merged successfully", {
      primaryId,
      secondaryId,
      companyId,
    });

    return true;
  } catch (error) {
    logger.error("[Merge] Error merging conversations", {
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
export async function findDuplicateConversations(
  leadId: string,
  channel: string,
  companyId: string
) {
  try {
    const conversations = await prisma.conversation.findMany({
      where: {
        leadId,
        channel,
        companyId,
        status: { not: "CLOSED" },
      },
      orderBy: { lastMessageAt: "desc" },
      take: 10,
    });

    if (conversations.length <= 1) return [];

    // Retornar todas excepto la más reciente
    return conversations.slice(1);
  } catch (error) {
    logger.error("[Merge] Error finding duplicates", {
      leadId,
      channel,
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}
