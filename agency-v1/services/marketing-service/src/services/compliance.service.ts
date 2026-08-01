import { prisma } from "@agency/database";

export class ComplianceService {
  /**
   * Registra el consentimiento para auditorías GDPR
   */
  static async recordConsent(email: string, companyId: string, source: string, ipAddress?: string) {
    return (prisma as any).consentLog.create({
      data: {
        email,
        companyId,
        source,
        ipAddress,
        consentedAt: new Date()
      }
    });
  }

  /**
   * Obtiene el historial de consentimientos de un contacto
   */
  static async getConsentLog(email: string, companyId: string) {
    return (prisma as any).consentLog.findMany({
      where: { email, companyId },
      orderBy: { consentedAt: 'desc' }
    });
  }

  /**
   * Obtiene las preferencias de suscripción
   */
  static async getPreferenceCenter(email: string, companyId: string) {
    const preferences = await (prisma as any).subscriberPreference.findFirst({
      where: { email, companyId }
    });
    
    return preferences || { email, companyId, frequency: 'weekly', categories: ['all'] };
  }

  /**
   * Actualiza las preferencias de un suscriptor
   */
  static async updatePreferences(email: string, companyId: string, preferences: any) {
    const existing = await (prisma as any).subscriberPreference.findFirst({
      where: { email, companyId }
    });

    if (existing) {
      return (prisma as any).subscriberPreference.update({
        where: { id: existing.id },
        data: preferences
      });
    } else {
      return (prisma as any).subscriberPreference.create({
        data: {
          email,
          companyId,
          ...preferences
        }
      });
    }
  }

  /**
   * Encuentra listas de correos no utilizadas en N días
   */
  static async getExpiredLists(companyId: string, daysInactive: number) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysInactive);
    
    return (prisma as any).mailingList.findMany({
      where: {
        companyId,
        lastUsedAt: { lt: cutoffDate }
      }
    });
  }

  /**
   * Genera reporte completo para exportación de datos de un contacto
   */
  static async generateGdprReport(email: string, companyId: string) {
    const consentLog = await this.getConsentLog(email, companyId);
    
    const campaignsReceived = await (prisma as any).emailBlastRecipient.findMany({
      where: { email, emailBlast: { companyId } },
      include: { emailBlast: { select: { name: true, sentAt: true } } }
    });
    
    const opens = await (prisma as any).emailOpenEvent.findMany({
      where: { email, companyId }
    });
    
    const clicks = await (prisma as any).emailClickEvent.findMany({
      where: { email, companyId }
    });

    return {
      email,
      companyId,
      reportGeneratedAt: new Date(),
      consentLog,
      campaignsReceived,
      activity: {
        opens,
        clicks
      }
    };
  }

  /**
   * Elimina toda la información de rastreo de un contacto (Right to erasure)
   */
  static async deleteContactData(email: string, companyId: string) {
    await (prisma as any).emailOpenEvent.deleteMany({ where: { email, companyId } });
    await (prisma as any).emailClickEvent.deleteMany({ where: { email, companyId } });
    await (prisma as any).consentLog.deleteMany({ where: { email, companyId } });
    await (prisma as any).subscriberPreference.deleteMany({ where: { email, companyId } });
    await (prisma as any).audienceSubscriber.deleteMany({ where: { email, companyId } });
    
    return { success: true, message: \`Todos los datos asociados al correo \${email} han sido eliminados.\` };
  }
}
