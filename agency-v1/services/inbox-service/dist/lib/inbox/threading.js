"use strict";
/**
 * Email Threading Support (P0 #1)
 *
 * Detects and manages email threads:
 * - Parses "RE:", "FWD:" patterns
 * - Tracks in_reply_to relationships
 * - Provides thread visualization
 * - Handles thread collapsing/expansion
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseEmailSubject = parseEmailSubject;
exports.linkMessageToThread = linkMessageToThread;
exports.getMessageThread = getMessageThread;
exports.getConversationThreads = getConversationThreads;
exports.getThreadVisibility = getThreadVisibility;
const database_1 = require("@agency/database");
const logger_1 = require("./logger");
/**
 * Detecta si un mensaje es una respuesta o reenvío
 * Retorna: { isReply, isFwd, cleanSubject }
 */
function parseEmailSubject(subject) {
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
async function linkMessageToThread(conversationId, messageId, subject, inReplyToHeader) {
    try {
        const parsed = parseEmailSubject(subject);
        // Si tiene In-Reply-To header, busca por externalId
        if (inReplyToHeader) {
            const parentMessage = await database_1.prisma.message.findFirst({
                where: {
                    conversationId,
                    externalId: inReplyToHeader,
                },
            });
            if (parentMessage) {
                await database_1.prisma.message.update({
                    where: { id: messageId },
                    data: { inReplyToId: parentMessage.id },
                });
                return parentMessage.id;
            }
        }
        // Si es un reply, busca el mensaje anterior en la conversación
        if (parsed.isReply) {
            const previousMessage = await database_1.prisma.message.findFirst({
                where: {
                    conversationId,
                    id: { not: messageId },
                },
                orderBy: { createdAt: "desc" },
                take: 1,
            });
            if (previousMessage) {
                await database_1.prisma.message.update({
                    where: { id: messageId },
                    data: { inReplyToId: previousMessage.id },
                });
                return previousMessage.id;
            }
        }
        return null;
    }
    catch (error) {
        logger_1.logger.error("[Threading] Error linking message to thread", {
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
async function getMessageThread(messageId) {
    try {
        const message = await database_1.prisma.message.findUnique({
            where: { id: messageId },
            include: {
                conversation: true,
            },
        });
        if (!message)
            return null;
        // Obtener todos los mensajes del thread (conectados vía inReplyToId)
        const threadMessages = await database_1.prisma.message.findMany({
            where: {
                conversationId: message.conversationId,
            },
            orderBy: { createdAt: "asc" },
        });
        // Construir árbol de replies
        const messageMap = new Map(threadMessages.map(m => [m.id, { ...m, children: [] }]));
        const rootMessages = [];
        for (const msg of Array.from(messageMap.values())) {
            if (msg.inReplyToId && messageMap.has(msg.inReplyToId)) {
                messageMap.get(msg.inReplyToId).children.push(msg);
            }
            else {
                rootMessages.push(msg);
            }
        }
        return {
            message,
            thread: rootMessages,
            totalMessages: threadMessages.length,
        };
    }
    catch (error) {
        logger_1.logger.error("[Threading] Error getting message thread", {
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
async function getConversationThreads(conversationId) {
    try {
        const messages = await database_1.prisma.message.findMany({
            where: { conversationId },
            orderBy: { createdAt: "asc" },
            include: { attachments: true },
        });
        if (!messages.length)
            return [];
        // Identificar root messages (sin inReplyToId)
        const threads = [];
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
    }
    catch (error) {
        logger_1.logger.error("[Threading] Error getting conversation threads", {
            conversationId,
            error: error instanceof Error ? error.message : String(error),
        });
        return [];
    }
}
function getReplies(messageId, allMessages) {
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
function getThreadVisibility(thread, expandedIds) {
    return {
        rootId: thread.rootId,
        rootMessage: thread.rootMessage,
        isExpanded: expandedIds.has(thread.rootId),
        replyCount: countReplies(thread.replies),
        lastReply: getLastReply(thread.replies),
        replies: expandedIds.has(thread.rootId) ? thread.replies : [],
    };
}
function countReplies(replies) {
    return replies.length + replies.reduce((sum, r) => sum + countReplies(r.replies), 0);
}
function getLastReply(replies) {
    if (!replies.length)
        return null;
    const lastReply = replies[replies.length - 1];
    const nestedLast = getLastReply(lastReply.replies);
    return nestedLast || lastReply;
}
//# sourceMappingURL=threading.js.map