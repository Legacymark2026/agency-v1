"use strict";
/**
 * Audit Logging for Compliance (P0 #3)
 *
 * Comprehensive audit trail for all inbox actions
 * - Tracks who, what, when, where
 * - Stores before/after values for changes
 * - Supports immutable audit logs (2 year retention)
 * - Enables compliance reports and investigations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.logAuditEvent = logAuditEvent;
exports.getAuditTrail = getAuditTrail;
exports.searchAuditLogs = searchAuditLogs;
exports.generateAuditReport = generateAuditReport;
exports.auditMessageSent = auditMessageSent;
exports.auditStatusChanged = auditStatusChanged;
exports.auditAssignmentChanged = auditAssignmentChanged;
const database_1 = require("@agency/database");
const logger_1 = require("./logger");
/**
 * Registra un evento de auditoría
 */
async function logAuditEvent(action, { conversationId, companyId, userId, resourceType, resourceId, oldValue, newValue, ipAddress, userAgent, metadata = {}, }) {
    try {
        await database_1.prisma.inboxAuditLog.create({
            data: {
                conversationId,
                companyId,
                userId,
                action,
                resourceType,
                resourceId,
                oldValue: oldValue ? JSON.parse(JSON.stringify(oldValue)) : null,
                newValue: newValue ? JSON.parse(JSON.stringify(newValue)) : null,
                ipAddress,
                userAgent,
                metadata: JSON.parse(JSON.stringify(metadata)),
            },
        });
        logger_1.logger.debug("[Audit] Event logged", {
            action,
            conversationId,
            resourceId,
        });
    }
    catch (error) {
        logger_1.logger.error("[Audit] Error logging event", {
            action,
            error: error instanceof Error ? error.message : String(error),
        });
        // No throw - no bloquear operaciones por fallo de auditoría
    }
}
/**
 * Obtiene histórico de auditoría para una conversación
 */
async function getAuditTrail(conversationId, limit = 100) {
    try {
        const logs = await database_1.prisma.inboxAuditLog.findMany({
            where: { conversationId },
            orderBy: { createdAt: "desc" },
            take: limit,
            include: {
                user: { select: { id: true, name: true, email: true } },
                company: { select: { id: true, name: true } },
            },
        });
        return logs.map(log => ({
            ...log,
            timestamp: log.createdAt,
            actor: log.user?.name || log.user?.email || "System",
        }));
    }
    catch (error) {
        logger_1.logger.error("[Audit] Error getting audit trail", {
            conversationId,
            error: error instanceof Error ? error.message : String(error),
        });
        return [];
    }
}
/**
 * Busca eventos de auditoría por filtros
 */
async function searchAuditLogs(companyId, filters) {
    try {
        const { action, userId, resourceType, resourceId, startDate, endDate, limit = 100 } = filters;
        const logs = await database_1.prisma.inboxAuditLog.findMany({
            where: {
                companyId,
                ...(action && { action }),
                ...(userId && { userId }),
                ...(resourceType && { resourceType }),
                ...(resourceId && { resourceId }),
                ...(startDate && { createdAt: { gte: startDate } }),
                ...(endDate && { createdAt: { lte: endDate } }),
            },
            orderBy: { createdAt: "desc" },
            take: limit,
            include: {
                user: { select: { id: true, name: true, email: true } },
            },
        });
        return logs;
    }
    catch (error) {
        logger_1.logger.error("[Audit] Error searching audit logs", {
            companyId,
            error: error instanceof Error ? error.message : String(error),
        });
        return [];
    }
}
/**
 * Expone datos de auditoría con formato para compliance reports
 */
async function generateAuditReport(companyId, startDate, endDate) {
    try {
        const logs = await database_1.prisma.inboxAuditLog.findMany({
            where: {
                companyId,
                createdAt: { gte: startDate, lte: endDate },
            },
            orderBy: { createdAt: "asc" },
            include: {
                user: { select: { name: true, email: true } },
                conversation: { select: { id: true, channel: true } },
            },
        });
        // Aggregate statistics
        const actionCounts = logs.reduce((acc, log) => {
            acc[log.action] = (acc[log.action] || 0) + 1;
            return acc;
        }, {});
        const userActivity = logs.reduce((acc, log) => {
            const key = log.user?.email || "System";
            if (!acc[key])
                acc[key] = { count: 0, actions: [] };
            acc[key].count++;
            acc[key].actions.push(log.action);
            return acc;
        }, {});
        return {
            period: { startDate, endDate },
            totalEvents: logs.length,
            actionCounts,
            userActivity,
            logs: logs.map(log => ({
                timestamp: log.createdAt.toISOString(),
                actor: log.user?.email || "System",
                action: log.action,
                resource: `${log.resourceType}:${log.resourceId}`,
                conversation: log.conversation?.id,
                changes: log.oldValue && log.newValue ? {
                    from: log.oldValue,
                    to: log.newValue,
                } : null,
            })),
        };
    }
    catch (error) {
        logger_1.logger.error("[Audit] Error generating report", {
            companyId,
            error: error instanceof Error ? error.message : String(error),
        });
        throw error;
    }
}
/**
 * Helper: Log message sent
 */
async function auditMessageSent(conversationId, messageId, companyId, userId, metadata) {
    return logAuditEvent("message_sent", {
        conversationId,
        companyId,
        userId,
        resourceType: "message",
        resourceId: messageId,
        newValue: { status: "SENT" },
        metadata,
    });
}
/**
 * Helper: Log status change
 */
async function auditStatusChanged(conversationId, companyId, userId, oldStatus, newStatus) {
    return logAuditEvent("status_changed", {
        conversationId,
        companyId,
        userId,
        resourceType: "conversation",
        resourceId: conversationId,
        oldValue: { status: oldStatus },
        newValue: { status: newStatus },
    });
}
/**
 * Helper: Log assignment change
 */
async function auditAssignmentChanged(conversationId, companyId, userId, oldAssignedTo, newAssignedTo) {
    return logAuditEvent("assigned_to_changed", {
        conversationId,
        companyId,
        userId,
        resourceType: "conversation",
        resourceId: conversationId,
        oldValue: { assignedTo: oldAssignedTo },
        newValue: { assignedTo: newAssignedTo },
    });
}
//# sourceMappingURL=audit.js.map