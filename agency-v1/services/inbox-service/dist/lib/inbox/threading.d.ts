/**
 * Email Threading Support (P0 #1)
 *
 * Detects and manages email threads:
 * - Parses "RE:", "FWD:" patterns
 * - Tracks in_reply_to relationships
 * - Provides thread visualization
 * - Handles thread collapsing/expansion
 */
/**
 * Detecta si un mensaje es una respuesta o reenvío
 * Retorna: { isReply, isFwd, cleanSubject }
 */
export declare function parseEmailSubject(subject: string): {
    isReply: boolean;
    isFwd: boolean;
    cleanSubject: string;
};
/**
 * Vincula un mensaje a su mensaje padre en un thread
 */
export declare function linkMessageToThread(conversationId: string, messageId: string, subject: string, inReplyToHeader?: string): Promise<string | null>;
/**
 * Obtiene el thread completo de un mensaje (arriba/abajo)
 */
export declare function getMessageThread(messageId: string): Promise<{
    message: any;
    thread: any[];
    totalMessages: any;
} | null>;
/**
 * Agrupa mensajes por thread en una conversación
 * Útil para vista colapsible
 */
export declare function getConversationThreads(conversationId: string): Promise<any[]>;
/**
 * Expande/colapsa un thread
 * Retorna estado visual para UI
 */
export declare function getThreadVisibility(thread: any, expandedIds: Set<string>): any;
