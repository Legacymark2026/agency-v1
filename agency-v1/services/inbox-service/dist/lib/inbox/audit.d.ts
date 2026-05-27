/**
 * Audit Logging for Compliance (P0 #3)
 *
 * Comprehensive audit trail for all inbox actions
 * - Tracks who, what, when, where
 * - Stores before/after values for changes
 * - Supports immutable audit logs (2 year retention)
 * - Enables compliance reports and investigations
 */
export type InboxAuditAction = "message_sent" | "message_deleted" | "status_changed" | "assigned_to_changed" | "macro_executed" | "tag_added" | "tag_removed" | "priority_changed" | "thread_merged" | "sla_breached" | "draft_created" | "draft_approved" | "draft_rejected";
/**
 * Registra un evento de auditoría
 */
export declare function logAuditEvent(action: InboxAuditAction, { conversationId, companyId, userId, resourceType, resourceId, oldValue, newValue, ipAddress, userAgent, metadata, }: {
    conversationId?: string;
    companyId: string;
    userId?: string;
    resourceType: "conversation" | "message" | "macro" | "draft";
    resourceId: string;
    oldValue?: any;
    newValue?: any;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, any>;
}): Promise<void>;
/**
 * Obtiene histórico de auditoría para una conversación
 */
export declare function getAuditTrail(conversationId: string, limit?: number): Promise<any>;
/**
 * Busca eventos de auditoría por filtros
 */
export declare function searchAuditLogs(companyId: string, filters: {
    action?: InboxAuditAction;
    userId?: string;
    resourceType?: string;
    resourceId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
}): Promise<any>;
/**
 * Expone datos de auditoría con formato para compliance reports
 */
export declare function generateAuditReport(companyId: string, startDate: Date, endDate: Date): Promise<{
    period: {
        startDate: Date;
        endDate: Date;
    };
    totalEvents: any;
    actionCounts: any;
    userActivity: any;
    logs: any;
}>;
/**
 * Helper: Log message sent
 */
export declare function auditMessageSent(conversationId: string, messageId: string, companyId: string, userId: string, metadata?: Record<string, any>): Promise<void>;
/**
 * Helper: Log status change
 */
export declare function auditStatusChanged(conversationId: string, companyId: string, userId: string, oldStatus: string, newStatus: string): Promise<void>;
/**
 * Helper: Log assignment change
 */
export declare function auditAssignmentChanged(conversationId: string, companyId: string, userId: string, oldAssignedTo: string | null, newAssignedTo: string | null): Promise<void>;
