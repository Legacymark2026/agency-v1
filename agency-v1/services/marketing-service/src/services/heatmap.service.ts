import { prisma } from "@agency/database";

export interface LinkClickHeatmapItem {
  url: string;
  clickCount: number;
  percentage: number;
  blockType?: string;
}

export class HeatmapService {
  /**
   * Generar métricas de mapa de calor agregadas para una campaña enviada
   */
  static async getCampaignHeatmap(blastId: string): Promise<LinkClickHeatmapItem[]> {
    const recipients = await (prisma as any).emailBlastRecipient.findMany({
      where: {
        blastId,
        clickedAt: { not: null }
      },
      select: {
        clickedUrl: true
      }
    });

    const totalClicks = recipients.length;
    if (totalClicks === 0) return [];

    const urlMap: Record<string, number> = {};
    recipients.forEach((r: any) => {
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
