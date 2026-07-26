import { prisma } from "@agency/database";
import { EventBus } from "@agency/events";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const eventBus = new EventBus(REDIS_URL, "marketing-service");

export interface CreateEmailBlastInput {
  companyId: string;
  name: string;
  subject: string;
  htmlBody: string;
  fromName?: string;
  fromEmail?: string;
  recipients?: Array<{ email: string; name?: string }>;
}

export class MarketingService {
  /**
   * Obtener lista de envíos de email por empresa
   */
  static async getEmailBlasts(companyId: string) {
    return (prisma as any).emailBlast.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { recipients: true } } }
    });
  }

  /**
   * Crear envío masivo de email con transacción atómica
   */
  static async createEmailBlast(input: CreateEmailBlastInput) {
    return prisma.$transaction(async (tx: any) => {
      const blast = await tx.emailBlast.create({
        data: {
          companyId: input.companyId,
          name: input.name,
          subject: input.subject,
          htmlBody: input.htmlBody,
          fromName: input.fromName || "LegacyMark",
          fromEmail: input.fromEmail || "noreply@legacymarksas.com",
          status: "DRAFT",
          totalRecipients: input.recipients ? input.recipients.length : 0,
          recipients: input.recipients ? {
            create: input.recipients.map(r => ({
              email: r.email,
              name: r.name,
              variant: "A",
              status: "PENDING"
            }))
          } : undefined
        },
        include: { recipients: true }
      });

      return blast;
    });
  }
}
