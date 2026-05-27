/**
 * Conversation Merge (P1 #9)
 *
 * Combine duplicate or related conversations:
 * - Merge messages from secondary to primary
 * - Preserve metadata from both
 * - Audit trail for merge operation
 * - Cascade delete secondary
 */
/**
 * Fusiona dos conversaciones en una
 */
export declare function mergeConversations(primaryId: string, secondaryId: string, companyId: string, userId: string): Promise<boolean>;
/**
 * Detecta conversaciones duplicadas basadas en lead + channel
 */
export declare function findDuplicateConversations(leadId: string, channel: string, companyId: string): Promise<any>;
