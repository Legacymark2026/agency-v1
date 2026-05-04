"use server";
/**
 * actions/inbox-advanced.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Advanced Inbox Server Actions (Fase P0-P1)
 *
 * Nuevas funcionalidades implementadas:
 * - Email Threading (P0 #1)
 * - SLA Tracking (P0 #2)
 * - Audit Logging (P0 #3)
 * - Multi-Attachment (P0 #4)
 * - RBAC Macros (P0 #5)
 * - Template Rendering (P1 #6)
 * - Draft Versioning (P1 #7)
 * - Webhook Execution (P1 #8)
 * - Conversation Merge (P1 #9)
 * - Tag History (P1 #10)
 */


import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logger } from "@/lib/logger";
import {
  initializeSLA,
  markFirstResponse,
  markAsResolved,
  pauseSLA,
  resumeSLA,
  getSLAWarning,
  getBreachedSLAs,
} from "@/lib/inbox/sla";
import {
  logAuditEvent,
  getAuditTrail,
  searchAuditLogs,
  generateAuditReport,
  auditMessageSent,
  auditStatusChanged,
  auditAssignmentChanged,
} from "@/lib/inbox/audit";
import {
  linkMessageToThread,
  getMessageThread,
  getConversationThreads,
} from "@/lib/inbox/threading";
import { renderTemplate, buildMacroTemplateContext } from "@/lib/inbox/templates";
import { sendWebhook } from "@/lib/inbox/webhooks";
import { mergeConversations, findDuplicateConversations } from "@/lib/inbox/merge";
import { emitSocketEvent } from "@/lib/inbox/socket";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * THREADING & EMAIL THREADING
 * ═══════════════════════════════════════════════════════════════════════════
 */

export async function getConversationThreads_Advanced(conversationId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) throw new Error("Conversation not found");

    // Permiso check
    const hasAccess = await checkConversationAccess(conversation.companyId, session.user.id);
    if (!hasAccess) throw new Error("Access denied");

    const threads = await getConversationThreads(conversationId);
    return threads;
  } catch (error) {
    logger.error("[Inbox Advanced] Error getting threads", {
      conversationId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

export async function getMessageThread_Advanced(messageId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  try {
    const thread = await getMessageThread(messageId);
    if (!thread) throw new Error("Message not found");

    const hasAccess = await checkConversationAccess(
      thread.message.conversation.companyId,
      session.user.id
    );
    if (!hasAccess) throw new Error("Access denied");

    return thread;
  } catch (error) {
    logger.error("[Inbox Advanced] Error getting message thread", {
      messageId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SLA TRACKING
 * ═══════════════════════════════════════════════════════════════════════════
 */

export async function initializeSLA_Advanced(
  conversationId: string,
  companyId: string
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  try {
    const hasAccess = await checkCompanyAccess(companyId, session.user.id);
    if (!hasAccess) throw new Error("Access denied");

    const sla = await initializeSLA(conversationId, companyId);

    await auditEventHelper("sla_initialized", {
      conversationId,
      companyId,
      userId: session.user.id,
    });

    return sla;
  } catch (error) {
    logger.error("[Inbox Advanced] Error initializing SLA", {
      conversationId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

export async function getSLAStatus_Advanced(conversationId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  try {
    const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
    if (!conversation) return null;

    const sla = await prisma.conversationSLA.findUnique({ where: { conversationId } });
    if (!sla) return null;

    const hasAccess = await checkConversationAccess(
      conversation.companyId,
      session.user.id
    );
    if (!hasAccess) throw new Error("Access denied");

    const warning = await getSLAWarning(conversationId);

    return { sla, warning };
  } catch (error) {
    logger.error("[Inbox Advanced] Error getting SLA status", {
      conversationId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

export async function getBreachedSLAs_Advanced(companyId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  try {
    const hasAccess = await checkCompanyAccess(companyId, session.user.id);
    if (!hasAccess) throw new Error("Access denied");

    const breached = await getBreachedSLAs(companyId);
    return breached;
  } catch (error) {
    logger.error("[Inbox Advanced] Error getting breached SLAs", {
      companyId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * AUDIT LOGGING
 * ═══════════════════════════════════════════════════════════════════════════
 */

export async function getAuditTrail_Advanced(
  conversationId: string,
  limit: number = 100
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) throw new Error("Conversation not found");

    const hasAccess = await checkConversationAccess(
      conversation.companyId,
      session.user.id
    );
    if (!hasAccess) throw new Error("Access denied");

    const trail = await getAuditTrail(conversationId, limit);
    return trail;
  } catch (error) {
    logger.error("[Inbox Advanced] Error getting audit trail", {
      conversationId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

export async function generateAuditReport_Advanced(
  companyId: string,
  startDate: Date,
  endDate: Date
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  try {
    const hasAccess = await checkCompanyAccess(companyId, session.user.id);
    if (!hasAccess) throw new Error("Access denied");

    // Solo admin puede generar reportes
    const userRole = await getUserRole(session.user.id, companyId);
    if (!["admin", "super_admin"].includes(userRole)) {
      throw new Error("Only admins can generate audit reports");
    }

    const report = await generateAuditReport(companyId, startDate, endDate);
    return report;
  } catch (error) {
    logger.error("[Inbox Advanced] Error generating audit report", {
      companyId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * DRAFT VERSIONING
 * ═══════════════════════════════════════════════════════════════════════════
 */

export async function createMessageDraft_Advanced(
  conversationId: string,
  content: string,
  currentUserId: string,
  status: string = "DRAFT"
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) throw new Error("Conversation not found");

    const hasAccess = await checkConversationAccess(
      conversation.companyId,
      session.user.id
    );
    if (!hasAccess) throw new Error("Access denied");

    // Crear draft con versión 1
    const draft = await prisma.messageDraft.create({
      data: {
        conversationId,
        messageId: "", // Placeholder - se asigna cuando se envia
        content,
        version: 1,
        status: status,
        createdBy: session.user.id,
      },
    });

    await logAuditEvent("draft_created", {
      conversationId,
      companyId: conversation.companyId,
      userId: session.user.id,
      resourceType: "draft",
      resourceId: draft.id,
      metadata: { version: 1 },
    });

    return draft;
  } catch (error) {
    logger.error("[Inbox Advanced] Error creating draft", {
      conversationId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

export async function approveDraft_Advanced(
  draftId: string,
  currentUserId: string,
  status: string = "APPROVED"
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  try {
    const draft = await prisma.messageDraft.findUnique({
      where: { id: draftId },
      include: { conversation: true },
    });

    if (!draft) throw new Error("Draft not found");

    const hasAccess = await checkConversationAccess(
      draft.conversation.companyId,
      session.user.id
    );
    if (!hasAccess) throw new Error("Access denied");

    // Verificar permisos de approval
    const userRole = await getUserRole(session.user.id, draft.conversation.companyId);
    if (!["admin", "super_admin", "content_manager"].includes(userRole)) {
      throw new Error("User cannot approve drafts");
    }

    const approval = await prisma.messageDraft.update({
      where: { id: draftId },
      data: {
        status: status,
        approvedBy: session.user.id,
        approvedAt: new Date(),
      },
    });

    await logAuditEvent("draft_approved", {
      conversationId: draft.conversationId,
      companyId: draft.conversation.companyId,
      userId: session.user.id,
      resourceType: "draft",
      resourceId: draftId,
    });

    return { success: true, ...approval };
  } catch (error) {
    logger.error("[Inbox Advanced] Error approving draft", {
      draftId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

export async function getDraftHistory_Advanced(conversationId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) throw new Error("Conversation not found");

    const hasAccess = await checkConversationAccess(
      conversation.companyId,
      session.user.id
    );
    if (!hasAccess) throw new Error("Access denied");

    const drafts = await prisma.messageDraft.findMany({
      where: { conversationId },
      orderBy: { createdAt: "desc" },
      include: {
        // Incluir user info si es necesario
      },
    });

    return drafts;
  } catch (error) {
    logger.error("[Inbox Advanced] Error getting draft history", {
      conversationId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TEMPLATE RENDERING (FOR MACROS)
 * ═══════════════════════════════════════════════════════════════════════════
 */

export async function renderMacroTemplate_Advanced(
  conversationId: string,
  template: string,
  companyId: string
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { lead: true, assignee: true },
    });

    if (!conversation) throw new Error("Conversation not found");

    const hasAccess = await checkConversationAccess(
      conversation.companyId,
      session.user.id
    );
    if (!hasAccess) throw new Error("Access denied");

    // Obtener contexto
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    const context = buildMacroTemplateContext({
      lead: conversation.lead,
      user: await prisma.user.findUnique({
        where: { id: session.user.id },
      }),
      company,
      conversation,
    });

    const renderedContent = renderTemplate(template, context);

    return {
      success: true,
      renderedContent,
      context,
    };
  } catch (error) {
    logger.error("[Inbox Advanced] Error rendering template", {
      conversationId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CONVERSATION MERGE
 * ═══════════════════════════════════════════════════════════════════════════
 */

export async function mergeConversations_Advanced(
  primaryId: string,
  secondaryId: string,
  companyId: string
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  try {
    const hasAccess = await checkCompanyAccess(companyId, session.user.id);
    if (!hasAccess) throw new Error("Access denied");

    // Solo admin puede mergear
    const userRole = await getUserRole(session.user.id, companyId);
    if (!["admin", "super_admin"].includes(userRole)) {
      throw new Error("Only admins can merge conversations");
    }

    const success = await mergeConversations(
      primaryId,
      secondaryId,
      companyId,
      session.user.id
    );

    return { success };
  } catch (error) {
    logger.error("[Inbox Advanced] Error merging conversations", {
      primaryId,
      secondaryId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

export async function findDuplicateConversations_Advanced(
  leadId: string,
  channel: string,
  companyId: string
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  try {
    const hasAccess = await checkCompanyAccess(companyId, session.user.id);
    if (!hasAccess) throw new Error("Access denied");

    const duplicates = await findDuplicateConversations(leadId, channel, companyId);

    return duplicates;
  } catch (error) {
    logger.error("[Inbox Advanced] Error finding duplicates", {
      leadId,
      channel,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * HELPER FUNCTIONS & ACCESS CONTROL
 * ═══════════════════════════════════════════════════════════════════════════
 */

async function checkCompanyAccess(
  companyId: string,
  userId: string
): Promise<boolean> {
  const membership = await prisma.companyUser.findFirst({
    where: {
      userId,
      companyId,
    },
  });

  return !!membership;
}

async function checkConversationAccess(
  companyId: string,
  userId: string
): Promise<boolean> {
  return checkCompanyAccess(companyId, userId);
}

async function getUserRole(userId: string, companyId: string): Promise<string> {
  const membership = await prisma.companyUser.findFirst({
    where: { userId, companyId },
  });

  return membership?.roleName || "member";
}

async function auditEventHelper(
  action: string,
  {
    conversationId,
    companyId,
    userId,
    metadata,
  }: {
    conversationId: string;
    companyId: string;
    userId: string;
    metadata?: Record<string, any>;
  }
) {
  return logAuditEvent(action as any, {
    conversationId,
    companyId,
    userId,
    resourceType: "conversation",
    resourceId: conversationId,
    metadata,
  });
}

export async function sendMessage_Advanced(
  conversationId: string,
  content: string | null,
  attachments: Array<{ fileName: string; mediaUrl: string; mediaType?: string; fileSize?: number }> = [],
  options: { direction?: string; externalId?: string; inReplyToHeader?: string } = {}
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const { direction = "OUTBOUND", externalId, inReplyToHeader } = options;

  try {
    const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
    if (!conversation) throw new Error("Conversation not found");

    const hasAccess = await checkConversationAccess(conversation.companyId, session.user.id);
    if (!hasAccess) throw new Error("Access denied");

    // Create the message
    const message = await prisma.message.create({
      data: {
        conversationId,
        content: content || null,
        type: content ? "TEXT" : "MEDIA",
        direction,
        senderId: session.user.id,
        status: "SENT",
        externalId: externalId || null,
      },
    });

    // Create attachments if any
    if (attachments && attachments.length) {
      const attachData = attachments.map(a => ({
        messageId: message.id,
        fileName: a.fileName,
        mediaUrl: a.mediaUrl,
        mediaType: a.mediaType || "image/jpeg",
        fileSize: a.fileSize || 0,
      }));

      await prisma.messageAttachment.createMany({ data: attachData });
    }

    // Thread linking (if email) using In-Reply-To or subject heuristics
    try {
      await linkMessageToThread(conversationId, message.id, content || "", inReplyToHeader);
    } catch (err) {
      logger.warn("[Inbox Advanced] Thread linking failed", { error: err instanceof Error ? err.message : String(err) });
    }

    // SLA: mark first response if outbound reply
    if (direction === "OUTBOUND") {
      try {
        await markFirstResponse(conversationId);
      } catch (err) {
        logger.warn("[Inbox Advanced] markFirstResponse failed", { error: err instanceof Error ? err.message : String(err) });
      }
    }

    // Audit
    try {
      await auditMessageSent(conversationId, message.id, conversation.companyId, session.user.id, {
        attachmentsCount: attachments.length,
      });
    } catch (err) {
      logger.warn("[Inbox Advanced] auditMessageSent failed", { error: err instanceof Error ? err.message : String(err) });
    }

    // Emit real-time event
    try {
      emitSocketEvent(conversation.companyId, "message.created", {
        conversationId,
        messageId: message.id,
      });
    } catch (err) {
      logger.warn("[Inbox Advanced] emitSocketEvent failed", { error: err instanceof Error ? err.message : String(err) });
    }

    // Update conversation lastMessageAt/preview
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessageAt: new Date(),
        lastMessagePreview: content ? content.substring(0, 200) : (attachments[0]?.fileName || null),
      },
    });

    return { success: true, messageId: message.id };
  } catch (error) {
    logger.error("[Inbox Advanced] Error sending message", {
      conversationId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TAG MANAGEMENT WITH HISTORY (P1 #10)
 * ═══════════════════════════════════════════════════════════════════════════
 */

export async function addTagToConversation_Advanced(
  conversationId: string,
  tagName: string
) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };

  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });
    if (!conversation) return { success: false, error: "Conversation not found" };

    const hasAccess = await checkConversationAccess(conversation.companyId, session.user.id);
    if (!hasAccess) return { success: false, error: "Access denied" };

    const currentTags: string[] = Array.isArray(conversation.tags)
      ? (conversation.tags as string[])
      : [];

    if (currentTags.includes(tagName)) return { success: true, alreadyExists: true };

    const newTags = [...currentTags, tagName];

    await prisma.$transaction([
      // Update conversation.tags[]
      prisma.conversation.update({
        where: { id: conversationId },
        data: { tags: newTags },
      }),
      // Write to InboxTagAssignment for history
      prisma.inboxTagAssignment.create({
        data: {
          conversationId,
          tagName,
          assignedBy: session.user.id,
        },
      }),
    ]);

    // Audit
    await logAuditEvent("tag_added", {
      conversationId,
      companyId: conversation.companyId,
      userId: session.user.id,
      resourceType: "conversation",
      resourceId: conversationId,
      newValue: { tag: tagName },
    });

    return { success: true, tags: newTags };
  } catch (error) {
    logger.error("[Inbox Advanced] Error adding tag", { conversationId, tagName, error });
    return { success: false, error: error instanceof Error ? error.message : "Failed to add tag" };
  }
}

export async function removeTagFromConversation_Advanced(
  conversationId: string,
  tagName: string
) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };

  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });
    if (!conversation) return { success: false, error: "Conversation not found" };

    const hasAccess = await checkConversationAccess(conversation.companyId, session.user.id);
    if (!hasAccess) return { success: false, error: "Access denied" };

    const currentTags: string[] = Array.isArray(conversation.tags)
      ? (conversation.tags as string[])
      : [];

    const newTags = currentTags.filter((t) => t !== tagName);

    await prisma.$transaction([
      prisma.conversation.update({
        where: { id: conversationId },
        data: { tags: newTags },
      }),
      // Mark the assignment as removed (set removedAt)
      prisma.inboxTagAssignment.updateMany({
        where: { conversationId, tagName, removedAt: null },
        data: { removedAt: new Date() },
      }),
    ]);

    await logAuditEvent("tag_removed", {
      conversationId,
      companyId: conversation.companyId,
      userId: session.user.id,
      resourceType: "conversation",
      resourceId: conversationId,
      oldValue: { tag: tagName },
    });

    return { success: true, tags: newTags };
  } catch (error) {
    logger.error("[Inbox Advanced] Error removing tag", { conversationId, tagName, error });
    return { success: false, error: error instanceof Error ? error.message : "Failed to remove tag" };
  }
}

export async function getTagHistory_Advanced(conversationId: string) {
  const session = await auth();
  if (!session?.user?.id) return [];

  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });
    if (!conversation) return [];

    const hasAccess = await checkConversationAccess(conversation.companyId, session.user.id);
    if (!hasAccess) return [];

    const history = await prisma.inboxTagAssignment.findMany({
      where: { conversationId },
      orderBy: { assignedAt: "desc" },
    });

    return history;
  } catch (error) {
    logger.error("[Inbox Advanced] Error getting tag history", { conversationId, error });
    return [];
  }
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * DRAFT APPROVAL — extended with REJECTED status
 * ═══════════════════════════════════════════════════════════════════════════
 */

export async function approveOrRejectDraft_Advanced(
  draftId: string,
  approverId: string,
  decision: "APPROVED" | "REJECTED"
) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };

  try {
    const draft = await prisma.messageDraft.findUnique({ where: { id: draftId } });
    if (!draft) return { success: false, error: "Draft not found" };

    const conversation = await prisma.conversation.findUnique({ where: { id: draft.conversationId } });
    if (!conversation) return { success: false, error: "Conversation not found" };

    const userRole = await getUserRole(session.user.id, conversation.companyId);
    if (!["admin", "super_admin", "content_manager"].includes(userRole)) {
      return { success: false, error: "Insufficient permissions to approve/reject drafts" };
    }

    if (decision === "REJECTED") {
      await prisma.messageDraft.delete({ where: { id: draftId } });
      await logAuditEvent("draft_rejected", {
        conversationId: draft.conversationId,
        companyId: conversation.companyId,
        userId: session.user.id,
        resourceType: "draft",
        resourceId: draftId,
      });
      return { success: true };
    }

    // APPROVED
    await prisma.messageDraft.update({
      where: { id: draftId },
      data: { status: "APPROVED", approvedBy: session.user.id, approvedAt: new Date() },
    });

    await logAuditEvent("draft_approved", {
      conversationId: draft.conversationId,
      companyId: conversation.companyId,
      userId: session.user.id,
      resourceType: "draft",
      resourceId: draftId,
    });

    return { success: true };
  } catch (error) {
    logger.error("[Inbox Advanced] Error approving/rejecting draft", { draftId, error });
    return { success: false, error: error instanceof Error ? error.message : "Failed" };
  }
}



