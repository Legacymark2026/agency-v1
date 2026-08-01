"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HeatmapService = void 0;
const database_1 = require("@agency/database");
class HeatmapService {
    /**
     * Generar métricas de mapa de calor agregadas para una campaña enviada
     */
    static async getCampaignHeatmap(blastId) {
        const recipients = await database_1.prisma.emailBlastRecipient.findMany({
            where: {
                blastId,
                clickedAt: { not: null }
            },
            select: {
                clickedUrl: true
            }
        });
        const totalClicks = recipients.length;
        if (totalClicks === 0)
            return [];
        const urlMap = {};
        recipients.forEach((r) => {
            const url = r.clickedUrl || "Desconocido";
            urlMap[url] = (urlMap[url] || 0) + 1;
        });
        return Object.entries(urlMap)
            .map(([url, count]) => ({
            url,
            clickCount: count,
            percentage: Math.round((count / totalClicks) * 100)
        }))
            .sort((a, b) => b.clickCount - a.clickCount);
    }
}
exports.HeatmapService = HeatmapService;
//# sourceMappingURL=heatmap.service.js.map