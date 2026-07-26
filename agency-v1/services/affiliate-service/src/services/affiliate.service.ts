import { prisma } from "@agency/database";
import { EventBus } from "@agency/events";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const eventBus = new EventBus(REDIS_URL, "affiliate-service");

export class AffiliateService {
  /**
   * Obtener perfil de afiliado por userId
   */
  static async getProfile(userId: string) {
    return (prisma as any).affiliateProfile.findUnique({
      where: { userId },
      include: {
        links: true,
        referrals: { take: 10, orderBy: { createdAt: "desc" } }
      }
    });
  }

  /**
   * Registrar clic en enlace de afiliado con transacción atómica
   */
  static async trackClick(code: string, ipAddress?: string, userAgent?: string) {
    return prisma.$transaction(async (tx: any) => {
      const link = await tx.affiliateLink.findUnique({
        where: { code }
      });

      if (!link) {
        throw new Error("Affiliate link not found");
      }

      const click = await tx.affiliateClick.create({
        data: {
          linkId: link.id,
          ipAddress: ipAddress || "127.0.0.1",
          userAgent: userAgent || "Unknown"
        }
      });

      await eventBus.publish("affiliate.click_registered", {
        linkId: link.id,
        code: link.code,
        timestamp: new Date().toISOString()
      });

      return { click, targetUrl: link.targetUrl };
    });
  }
}
