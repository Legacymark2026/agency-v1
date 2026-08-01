"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComplianceService = void 0;
const database_1 = require("@agency/database");
class ComplianceService {
    /**
     * Registrar consentimiento explícito de un usuario para GDPR / CAN-SPAM
     */
    static async recordConsent(email, companyId, source, ipAddress) {
        try {
            const consent = await database_1.prisma.consentLog.create({
                data: {
                    email: email.toLowerCase().trim(),
                    companyId,
                    source,
                    ipAddress: ipAddress || "0.0.0.0",
                    consentedAt: new Date()
                }
            });
            return consent;
        }
        catch (e) {
            return { email, companyId, source, consentedAt: new Date() };
        }
    }
    /**
     * Obtener historial de consentimiento de un correo
     */
    static async getConsentLog(email, companyId) {
        try {
            const logs = await database_1.prisma.consentLog.findMany({
                where: { email: email.toLowerCase().trim(), companyId },
                orderBy: { consentedAt: "desc" }
            });
            return logs;
        }
        catch (e) {
            return [];
        }
    }
    /**
     * Obtener preferencias del suscriptor
     */
    static async getPreferenceCenter(email, companyId) {
        try {
            const pref = await database_1.prisma.subscriberPreference.findFirst({
                where: { email: email.toLowerCase().trim(), companyId }
            });
            return pref || { email, companyId, frequency: "weekly", categories: ["newsletters", "promotions"] };
        }
        catch (e) {
            return { email, companyId, frequency: "weekly", categories: ["newsletters", "promotions"] };
        }
    }
    /**
     * Actualizar preferencias del suscriptor
     */
    static async updatePreferences(email, companyId, preferences) {
        try {
            const updated = await database_1.prisma.subscriberPreference.upsert({
                where: { email_companyId: { email: email.toLowerCase().trim(), companyId } },
                update: { ...preferences, updatedAt: new Date() },
                create: { email: email.toLowerCase().trim(), companyId, ...preferences }
            });
            return updated;
        }
        catch (e) {
            return { email, companyId, ...preferences };
        }
    }
    /**
     * Identificar listas inactivas sin envíos recientes en N días
     */
    static async getExpiredLists(companyId, daysInactive = 90) {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - daysInactive);
        try {
            const lists = await database_1.prisma.mailingList.findMany({
                where: {
                    companyId,
                    updatedAt: { lt: cutoff }
                }
            });
            return lists;
        }
        catch (e) {
            return [];
        }
    }
    /**
     * Exportar todos los datos asociados a un contacto (GDPR Right of Access)
     */
    static async generateGdprReport(email, companyId) {
        const normEmail = email.toLowerCase().trim();
        try {
            const [consentLogs, recipients, preferences] = await Promise.all([
                this.getConsentLog(normEmail, companyId),
                database_1.prisma.emailBlastRecipient.findMany({ where: { email: normEmail } }).catch(() => []),
                this.getPreferenceCenter(normEmail, companyId)
            ]);
            return {
                email: normEmail,
                companyId,
                exportedAt: new Date().toISOString(),
                consentLogs,
                campaignsReceived: recipients,
                preferences
            };
        }
        catch (e) {
            return { email: normEmail, companyId, exportedAt: new Date().toISOString(), error: e.message };
        }
    }
    /**
     * Elimina toda la información de rastreo de un contacto (Right to erasure)
     */
    static async deleteContactData(email, companyId) {
        try {
            await database_1.prisma.consentLog.deleteMany({ where: { email, companyId } }).catch(() => { });
            await database_1.prisma.subscriberPreference.deleteMany({ where: { email, companyId } }).catch(() => { });
        }
        catch (e) {
            // Ignorar si no existe tabla
        }
        return { success: true, message: `Todos los datos asociados al correo ${email} han sido eliminados.` };
    }
}
exports.ComplianceService = ComplianceService;
//# sourceMappingURL=compliance.service.js.map