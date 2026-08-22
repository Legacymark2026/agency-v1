"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AffiliateService = void 0;
const database_1 = require("@agency/database");
const events_1 = require("@agency/events");
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const eventBus = new events_1.EventBus(REDIS_URL, "affiliate-service");
class AffiliateService {
    /**
     * Obtener perfil de afiliado por userId
     */
    static async getProfile(userId) {
        return database_1.prisma.affiliateProfile.findUnique({
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
    static async trackClick(code, ipAddress, userAgent) {
        return database_1.prisma.$transaction(async (tx) => {
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
exports.AffiliateService = AffiliateService;
//# sourceMappingURL=affiliate.service.js.map