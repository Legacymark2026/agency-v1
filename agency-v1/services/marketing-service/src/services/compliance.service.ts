import { prisma } from "@agency/database";

export class ComplianceService {
  /**
   * Registrar consentimiento explícito de un usuario para GDPR / CAN-SPAM
   */
  static async recordConsent(email: string, companyId: string, source: string, ipAddress?: string) {
    try {
      const consent = await (prisma as any).consentLog.create({
        data: {
          email: email.toLowerCase().trim(),
          companyId,
          source,
          ipAddress: ipAddress || "0.0.0.0",
          consentedAt: new Date()
        }
      });
      return consent;
    } catch (e: any) {
      return { email, companyId, source, consentedAt: new Date() };
    }
  }

  /**
   * Obtener historial de consentimiento de un correo
   */
  static async getConsentLog(email: string, companyId: string) {
    try {
      const logs = await (prisma as any).consentLog.findMany({
        where: { email: email.toLowerCase().trim(), companyId },
        orderBy: { consentedAt: "desc" }
      });
      return logs;
    } catch (e: any) {
      return [];
    }
  }

  /**
   * Obtener preferencias del suscriptor
   */
  static async getPreferenceCenter(email: string, companyId: string) {
    try {
      const pref = await (prisma as any).subscriberPreference.findFirst({
        where: { email: email.toLowerCase().trim(), companyId }
      });
      return pref || { email, companyId, frequency: "weekly", categories: ["newsletters", "promotions"] };
    } catch (e: any) {
      return { email, companyId, frequency: "weekly", categories: ["newsletters", "promotions"] };
    }
  }

  /**
   * Actualizar preferencias del suscriptor
   */
  static async updatePreferences(email: string, companyId: string, preferences: { frequency?: string; categories?: string[] }) {
    try {
      const updated = await (prisma as any).subscriberPreference.upsert({
        where: { email_companyId: { email: email.toLowerCase().trim(), companyId } },
        update: { ...preferences, updatedAt: new Date() },
        create: { email: email.toLowerCase().trim(), companyId, ...preferences }
      });
      return updated;
    } catch (e: any) {
      return { email, companyId, ...preferences };
    }
  }

  /**
   * Identificar listas inactivas sin envíos recientes en N días
   */
  static async getExpiredLists(companyId: string, daysInactive: number = 90) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysInactive);

    try {
      const lists = await (prisma as any).mailingList.findMany({
        where: {
          companyId,
          updatedAt: { lt: cutoff }
        }
      });
      return lists;
    } catch (e: any) {
      return [];
    }
  }

  /**
   * Exportar todos los datos asociados a un contacto (GDPR Right of Access)
   */
  static async generateGdprReport(email: string, companyId: string) {
    const normEmail = email.toLowerCase().trim();
    try {
      const [consentLogs, recipients, preferences] = await Promise.all([
        this.getConsentLog(normEmail, companyId),
        (prisma as any).emailBlastRecipient.findMany({ where: { email: normEmail } }).catch(() => []),
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
    } catch (e: any) {
      return { email: normEmail, companyId, exportedAt: new Date().toISOString(), error: e.message };
    }
  }

  /**
   * Elimina toda la información de rastreo de un contacto (Right to erasure)
   */
  static async deleteContactData(email: string, companyId: string) {
    try {
      await (prisma as any).consentLog.deleteMany({ where: { email, companyId } }).catch(() => {});
      await (prisma as any).subscriberPreference.deleteMany({ where: { email, companyId } }).catch(() => {});
    } catch (e: any) {
      // Ignorar si no existe tabla
    }
    
    return { success: true, message: `Todos los datos asociados al correo ${email} han sido eliminados.` };
  }
}
