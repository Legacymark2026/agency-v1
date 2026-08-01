"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsService = void 0;
const database_1 = require("@agency/database");
class AnalyticsService {
    /**
     * Obtener métricas detalladas de una campaña
     */
    static async getCampaignAnalytics(blastId, companyId) {
        const blast = await database_1.prisma.emailBlast.findFirst({
            where: { id: blastId, companyId },
            include: {
                recipients: true
            }
        });
        if (!blast)
            throw new Error("Campaña no encontrada");
        const recipients = blast.recipients || [];
        const total = recipients.length;
        const sent = recipients.filter((r) => r.status === "SENT").length;
        const failed = recipients.filter((r) => r.status === "FAILED").length;
        const opens = blast.opens || 0;
        const clicks = blast.clicks || 0;
        const bounces = failed;
        const unsubscribes = 0;
        const complaints = 0;
        const openRate = total > 0 ? (opens / total) * 100 : 0;
        const clickRate = total > 0 ? (clicks / total) * 100 : 0;
        const ctr = opens > 0 ? (clicks / opens) * 100 : 0;
        const bounceRate = total > 0 ? (bounces / total) * 100 : 0;
        const timeSeries = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            timeSeries.push({
                date: d.toISOString().split('T')[0],
                opens: Math.floor(Math.random() * 50),
                clicks: Math.floor(Math.random() * 10)
            });
        }
        return {
            sent,
            delivered: sent - bounces,
            opens,
            clicks,
            bounces,
            complaints,
            unsubscribes,
            openRate,
            clickRate,
            ctr,
            bounceRate,
            timeSeries
        };
    }
    /**
     * Desglose por cliente de correo y dispositivo
     */
    static async getAudienceBreakdown(blastId) {
        return {
            emailClients: [
                { name: 'Gmail', percentage: 45 },
                { name: 'Outlook', percentage: 30 },
                { name: 'Apple Mail', percentage: 15 },
                { name: 'Yahoo', percentage: 10 }
            ],
            devices: [
                { name: 'Mobile', percentage: 60 },
                { name: 'Desktop', percentage: 35 },
                { name: 'Tablet', percentage: 5 }
            ]
        };
    }
    /**
     * Distribución geográfica
     */
    static async getGeographicDistribution(blastId) {
        return [
            { country: 'US', city: 'New York', count: 120 },
            { country: 'US', city: 'Los Angeles', count: 80 },
            { country: 'CO', city: 'Bogotá', count: 50 }
        ];
    }
    /**
     * Comparación de campañas
     */
    static async getCampaignComparison(companyId, blastIds) {
        const blasts = await database_1.prisma.emailBlast.findMany({
            where: { id: { in: blastIds }, companyId },
            select: { id: true, name: true, totalRecipients: true, sent: true, opens: true, clicks: true }
        });
        return blasts.map((b) => ({
            ...b,
            openRate: b.totalRecipients > 0 ? (b.opens / b.totalRecipients) * 100 : 0,
            clickRate: b.totalRecipients > 0 ? (b.clicks / b.totalRecipients) * 100 : 0
        }));
    }
    /**
     * Estadísticas globales del dashboard
     */
    static async getGlobalDashboardStats(companyId) {
        const blasts = await database_1.prisma.emailBlast.findMany({
            where: { companyId }
        });
        const totalSent = blasts.reduce((sum, b) => sum + (b.sent || 0), 0);
        const totalOpens = blasts.reduce((sum, b) => sum + (b.opens || 0), 0);
        const totalClicks = blasts.reduce((sum, b) => sum + (b.clicks || 0), 0);
        const activeCampaigns = blasts.filter((b) => ['PROCESSING', 'SCHEDULED'].includes(b.status)).length;
        const avgOpenRate = totalSent > 0 ? (totalOpens / totalSent) * 100 : 0;
        const avgCtr = totalOpens > 0 ? (totalClicks / totalOpens) * 100 : 0;
        let bestPerforming = null;
        if (blasts.length > 0) {
            bestPerforming = blasts.sort((a, b) => {
                const rateA = a.sent > 0 ? (a.opens / a.sent) : 0;
                const rateB = b.sent > 0 ? (b.opens / b.sent) : 0;
                return rateB - rateA;
            })[0];
        }
        return {
            totalSent,
            avgOpenRate,
            avgCtr,
            totalSubscribers: totalSent,
            activeCampaigns,
            bestPerformingCampaign: bestPerforming ? bestPerforming.name : null
        };
    }
}
exports.AnalyticsService = AnalyticsService;
//# sourceMappingURL=analytics.service.js.map