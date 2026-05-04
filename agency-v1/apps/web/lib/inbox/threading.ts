/**
 * lib/inbox/threading.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Email Threading Support (P0 #1)
 *
 * Detects and manages email threads:
 * - Parses "RE:", "FWD:" patterns
 * - Tracks in_reply_to relationships
 * - Provides thread visualization
 * - Handles thread collapsing/expansion
 */

import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

/**
 * Detecta si un mensaje es una respuesta o reenvío
 * Retorna: { isReply, isFwd, originalSubject, inReplyToId }
 */
export function parseEmailSubject(subject: string) {
  const replyPattern = /^re:\s*/i;
  const fwdPattern = /^fwd?:\s*/i;

  const isReply = replyPattern.test(subject);
  const isFwd = fwdPattern.test(subject);

  const cleanSubject = subject
    .replace(replyPattern, "")
    .replace(fwdPattern, "")
    .trim();

  return {
    isReply,
    isFwd,
    cleanSubject,
  };
}

/**
 * Vincula un mensaje a su mensaje padre en un thread
 */
export async function linkMessageToThread(
  conversationId: string,
  messageId: string,
  subject: string,
  inReplyToHeader?: string
): Promise<string | null> {
  try {
    const parsed = parseEmailSubject(subject);

    // Si tiene In-Reply-To header, busca por externalId
    if (inReplyToHeader) {
      const parentMessage = await prisma.message.findFirst({
        where: {
          conversationId,
          externalId: inReplyToHeader,
        },
      });

      if (parentMessage) {
        await prisma.message.update({
          where: { id: messageId },
          data: { inReplyToId: parentMessage.id },
        });
        return parentMessage.id;
      }
    }

    // Si es un reply, busca el mensaje anterior en la conversación
    if (parsed.isReply) {
      const previousMessage = await prisma.message.findFirst({
        where: {
          conversationId,
          id: { not: messageId },
        },
        orderBy: { createdAt: "desc" },
        take: 1,
      });

      if (previousMessage) {
        await prisma.message.update({
          where: { id: messageId },
          data: { inReplyToId: previousMessage.id },
        });
        return previousMessage.id;
      }
    }

    return null;
  } catch (error) {
    logger.error("[Threading] Error linking message to thread", {
      conversationId,
      messageId,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * Obtiene el thread completo de un mensaje (arriba/abajo)
 */
export async function getMessageThread(messageId: string) {
  try {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        conversation: true,
      },
    });

    if (!message) return null;

    // Obtener todos los mensajes del thread (conectados vía inReplyToId)
    const threadMessages = await prisma.message.findMany({
      where: {
        conversationId: message.conversationId,
      },
      orderBy: { createdAt: "asc" },
    });

    // Construir árbol de replies
    const messageMap = new Map(threadMessages.map(m => [m.id, { ...m, children: [] as any[] }]));
    const rootMessages: any[] = [];

    for (const msg of Array.from(messageMap.values())) {
      if (msg.inReplyToId && messageMap.has(msg.inReplyToId)) {
        messageMap.get(msg.inReplyToId)!.children.push(msg);
      } else {
        rootMessages.push(msg);
      }
    }

    return {
      message,
      thread: rootMessages,
      totalMessages: threadMessages.length,
    };
  } catch (error) {
    logger.error("[Threading] Error getting message thread", {
      messageId,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * Agrupa mensajes por thread en una conversación
 * Útil para vista colapsible
 */
export async function getConversationThreads(conversationId: string) {
  try {
    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
      include: { attachments: true },
    });

    if (!messages.length) return [];

    // Identificar root messages (sin inReplyToId)
    const threads: any[] = [];
    const messageMap = new Map(messages.map(m => [m.id, m]));

    for (const msg of messages) {
      if (!msg.inReplyToId) {
        // Es un root message
        threads.push({
          rootId: msg.id,
          rootMessage: msg,
          replies: getReplies(msg.id, messages),
          expandedByDefault: false,
        });
      }
    }

    return threads;
  } catch (error) {
    logger.error("[Threading] Error getting conversation threads", {
      conversationId,
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}

function getReplies(messageId: string, allMessages: any[]): any[] {
  return allMessages
    .filter(m => m.inReplyToId === messageId)
    .map(r => ({
      ...r,
      replies: getReplies(r.id, allMessages),
    }));
}

/**
 * Expande/colapsa un thread
 * Retorna estado visual para UI
 */
export function getThreadVisibility(thread: any, expandedIds: Set<string>): any {
  return {
    rootId: thread.rootId,
    rootMessage: thread.rootMessage,
    isExpanded: expandedIds.has(thread.rootId),
    replyCount: countReplies(thread.replies),
    lastReply: getLastReply(thread.replies),
    replies: thread.isExpanded ? thread.replies : [],
  };
}

function countReplies(replies: any[]): number {
  return replies.length + replies.reduce((sum, r) => sum + countReplies(r.replies), 0);
}

function getLastReply(replies: any[]): any {
  if (!replies.length) return null;
  const lastReply = replies[replies.length - 1];
  const nestedLast = getLastReply(lastReply.replies);
  return nestedLast || lastReply;
}
