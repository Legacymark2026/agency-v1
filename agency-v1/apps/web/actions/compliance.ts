"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * ISO 27701 (Privacy / GDPR) — Export User PII Data
 */
export async function exportUserData() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: "No autorizado" };
        }

        const userId = session.user.id;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
                updatedAt: true,
            }
        });

        if (!user) {
            return { success: false, error: "Usuario no encontrado" };
        }

        const auditLogs = await prisma.inboxAuditLog.findMany({
            where: { userId },
            take: 100,
            orderBy: { createdAt: "desc" }
        }).catch(() => []);

        const exportData = {
            metadata: {
                exportedAt: new Date().toISOString(),
                standard: "ISO/IEC 27701:2019 / GDPR Article 20",
                complianceOwner: "LegacyMark BIC S.A.S"
            },
            personalData: user,
            activityAuditTrail: auditLogs
        };

        return {
            success: true,
            data: exportData
        };
    } catch (error: any) {
        console.error("[Compliance Action] Error exporting data:", error);
        return { success: false, error: error.message };
    }
}

/**
 * ISO 27701 (Privacy / Right to be Forgotten) — Request Account & Data Anonymization
 */
export async function requestDataAnonymization() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: "No autorizado" };
        }

        const userId = session.user.id;

        // Perform soft-deletion & PII anonymization to maintain DB integrity while fulfilling GDPR Right to be Forgotten
        await prisma.user.update({
            where: { id: userId },
            data: {
                name: "Usuario Anonimizado (ISO 27701)",
                email: `anonymized-${userId.substring(0, 8)}@deleted.privacy`,
                deactivatedAt: new Date(),
            }
        });

        return {
            success: true,
            message: "Tus datos personales han sido anonimizados conforme a la norma ISO 27701 / GDPR."
        };
    } catch (error: any) {
        console.error("[Compliance Action] Error anonymizing data:", error);
        return { success: false, error: error.message };
    }
}

/**
 * ISO 27001 (Audit Trail) — Get System Audit Logs for Admin Dashboard
 */
export async function getComplianceAuditLogs(page = 1, limit = 20) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: "No autorizado", data: [], total: 0 };
        }

        const skip = (page - 1) * limit;

        const [logs, total] = await Promise.all([
            prisma.inboxAuditLog.findMany({
                where: session.user.companyId ? { companyId: session.user.companyId } : {},
                orderBy: { createdAt: "desc" },
                take: limit,
                skip,
                include: {
                    user: {
                        select: { name: true, email: true }
                    }
                }
            }).catch(() => []),
            prisma.inboxAuditLog.count({
                where: session.user.companyId ? { companyId: session.user.companyId } : {}
            }).catch(() => 0)
        ]);

        return {
            success: true,
            data: logs,
            total,
            page,
            limit
        };
    } catch (error: any) {
        console.error("[Compliance Action] Error fetching audit logs:", error);
        return { success: false, error: error.message, data: [], total: 0 };
    }
}
