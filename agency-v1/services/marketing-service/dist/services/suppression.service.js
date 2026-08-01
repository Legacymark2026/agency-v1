"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SuppressionService = void 0;
const database_1 = require("@agency/database");
class SuppressionService {
    /**
     * Obtener lista de emails suprimidos para una empresa
     */
    static async getSuppressionList(companyId) {
        return database_1.prisma.suppressionList.findMany({
            where: { companyId },
            orderBy: { createdAt: "desc" }
        });
    }
    /**
     * Filtrar destinatarios removiendo los que están en la lista de supresión
     */
    static async filterSuppressedRecipients(companyId, recipients) {
        if (!recipients.length)
            return { valid: [], suppressedCount: 0 };
        try {
            const emails = recipients.map((r) => r.email.toLowerCase().trim());
            const suppressedRecords = await database_1.prisma.suppressionList.findMany({
                where: {
                    companyId,
                    email: { in: emails }
                },
                select: { email: true }
            });
            const suppressedSet = new Set(suppressedRecords.map((s) => s.email.toLowerCase()));
            const valid = recipients.filter((r) => !suppressedSet.has(r.email.toLowerCase().trim()));
            return {
                valid,
                suppressedCount: recipients.length - valid.length
            };
        }
        catch (err) {
            console.warn("[SuppressionService] Suppression table check skipped due to DB error:", err?.message || err);
            return { valid: recipients, suppressedCount: 0 };
        }
    }
    /**
     * Agregar un email a la lista de supresión de la empresa
     */
    static async addToSuppression(companyId, email, reason) {
        const cleanEmail = email.toLowerCase().trim();
        return database_1.prisma.suppressionList.upsert({
            where: {
                companyId_email: {
                    companyId,
                    email: cleanEmail
                }
            },
            update: { reason },
            create: {
                companyId,
                email: cleanEmail,
                reason
            }
        });
    }
    /**
     * Eliminar un email de la lista de supresión
     */
    static async removeFromSuppression(companyId, email) {
        const cleanEmail = email.toLowerCase().trim();
        return database_1.prisma.suppressionList.deleteMany({
            where: {
                companyId,
                email: cleanEmail
            }
        });
    }
}
exports.SuppressionService = SuppressionService;
//# sourceMappingURL=suppression.service.js.map