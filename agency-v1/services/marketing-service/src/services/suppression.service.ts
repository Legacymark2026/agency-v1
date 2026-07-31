import { prisma } from "@agency/database";

export class SuppressionService {
  /**
   * Obtener lista de emails suprimidos para una empresa
   */
  static async getSuppressionList(companyId: string) {
    return (prisma as any).suppressionList.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" }
    });
  }

  /**
   * Filtrar destinatarios removiendo los que están en la lista de supresión
   */
  static async filterSuppressedRecipients<T extends { email: string }>(
    companyId: string,
    recipients: T[]
  ): Promise<{ valid: T[]; suppressedCount: number }> {
    if (!recipients.length) return { valid: [], suppressedCount: 0 };

    try {
      const emails = recipients.map((r) => r.email.toLowerCase().trim());
      const suppressedRecords = await (prisma as any).suppressionList.findMany({
        where: {
          companyId,
          email: { in: emails }
        },
        select: { email: true }
      });

      const suppressedSet = new Set(suppressedRecords.map((s: any) => s.email.toLowerCase()));
      const valid = recipients.filter((r) => !suppressedSet.has(r.email.toLowerCase().trim()));

      return {
        valid,
        suppressedCount: recipients.length - valid.length
      };
    } catch (err: any) {
      console.warn("[SuppressionService] Suppression table check skipped due to DB error:", err?.message || err);
      return { valid: recipients, suppressedCount: 0 };
    }
  }

  /**
   * Agregar un email a la lista de supresión de la empresa
   */
  static async addToSuppression(companyId: string, email: string, reason: string) {
    const cleanEmail = email.toLowerCase().trim();
    return (prisma as any).suppressionList.upsert({
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
  static async removeFromSuppression(companyId: string, email: string) {
    const cleanEmail = email.toLowerCase().trim();
    return (prisma as any).suppressionList.deleteMany({
      where: {
        companyId,
        email: cleanEmail
      }
    });
  }
}
