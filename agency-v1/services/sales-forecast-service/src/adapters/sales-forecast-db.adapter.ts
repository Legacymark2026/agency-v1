import { prisma } from "@agency/database";
import { ISalesForecastRepositoryPort } from "../core/ports/sales-forecast.ports";
import {
  DiscountTableProps,
  DiscountTierProps,
  HistoricalSalePoint,
  MLForecastResult,
  ScenarioSimulationProps,
  ScenarioSimulationResult
} from "../core/domain/sales-forecast.domain";

export class PrismaSalesForecastAdapter implements ISalesForecastRepositoryPort {
  async createDiscountTable(table: Omit<DiscountTableProps, "id">): Promise<DiscountTableProps> {
    const { tiers, ...rest } = table;
    const created = await (prisma as any).discountTable.create({
      data: {
        ...rest,
        tiers: {
          create: tiers.map((t: DiscountTierProps) => ({
            minQuantity: t.minQuantity,
            maxQuantity: t.maxQuantity,
            discountPct: t.discountPct,
            fixedDiscount: t.fixedDiscount || 0,
            minMarginFloorPct: t.minMarginFloorPct,
          })),
        },
      },
      include: { tiers: true },
    });
    return created;
  }

  async listDiscountTables(companyId: string): Promise<DiscountTableProps[]> {
    return (prisma as any).discountTable.findMany({
      where: { companyId },
      include: { tiers: { orderBy: { minQuantity: "asc" } } },
      orderBy: { createdAt: "desc" },
    });
  }

  async getDiscountTableByCode(companyId: string, code: string): Promise<DiscountTableProps | null> {
    return (prisma as any).discountTable.findUnique({
      where: { companyId_code: { companyId, code } },
      include: { tiers: { orderBy: { minQuantity: "asc" } } },
    });
  }

  async toggleDiscountTable(id: string, isActive: boolean): Promise<DiscountTableProps> {
    return (prisma as any).discountTable.update({
      where: { id },
      data: { isActive },
      include: { tiers: true },
    });
  }

  async getHistoricalSales(companyId: string, productId?: string, months: number = 12): Promise<HistoricalSalePoint[]> {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    // Consumir movimientos reales de salida por venta (OUT_SALE)
    const where: any = {
      companyId,
      movementType: "OUT_SALE",
      createdAt: { gte: startDate },
    };
    if (productId) where.productId = productId;

    const movements = await (prisma as any).stockMovement.findMany({
      where,
      orderBy: { createdAt: "asc" },
    });

    // Agrupar por producto y por periodo mensual
    const monthlyMap = new Map<string, { units: number; revenue: number; productId: string; sku?: string; productName?: string }>();
    for (const m of movements) {
      const d = new Date(m.createdAt);
      const periodKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const prodKey = `${m.productId || "default"}__${periodKey}`;
      const cur = monthlyMap.get(prodKey) || {
        units: 0,
        revenue: 0,
        productId: m.productId || "default",
        sku: m.sku || "SKU-GEN",
        productName: m.productName || "Producto Comercial",
      };
      cur.units += Number(m.quantity) || 0;
      cur.revenue += Number(m.totalCost) || 0;
      monthlyMap.set(prodKey, cur);
    }

    const points: HistoricalSalePoint[] = [];
    for (const [key, data] of monthlyMap.entries()) {
      const period = key.split("__")[1];
      points.push({
        date: new Date(`${period}-01`),
        period,
        productId: data.productId,
        sku: data.sku,
        productName: data.productName,
        unitsSold: data.units,
        revenue: data.revenue,
        avgPrice: data.units > 0 ? Math.round(data.revenue / data.units) : 0,
      });
    }

    return points;
  }

  async saveForecastRecord(forecast: MLForecastResult & { companyId: string }): Promise<any> {
    return (prisma as any).salesForecastRecord.upsert({
      where: {
        companyId_productId_forecastPeriod: {
          companyId: forecast.companyId,
          productId: forecast.productId,
          forecastPeriod: forecast.forecastPeriod,
        },
      },
      update: {
        predictedUnits: forecast.predictedUnits,
        predictedRevenue: forecast.predictedRevenue,
        confidenceScore: forecast.confidenceScore,
        modelUsed: forecast.modelType,
        historicalTrendPct: forecast.trendPct,
        seasonalityFactor: forecast.seasonalityMultiplier,
      },
      create: {
        companyId: forecast.companyId,
        productId: forecast.productId,
        sku: forecast.sku,
        productName: forecast.productName,
        forecastPeriod: forecast.forecastPeriod,
        predictedUnits: forecast.predictedUnits,
        predictedRevenue: forecast.predictedRevenue,
        confidenceScore: forecast.confidenceScore,
        modelUsed: forecast.modelType,
        historicalTrendPct: forecast.trendPct,
        seasonalityFactor: forecast.seasonalityMultiplier,
      },
    });
  }

  async listForecasts(companyId: string, period?: string): Promise<any[]> {
    const where: any = { companyId };
    if (period) where.forecastPeriod = period;
    return (prisma as any).salesForecastRecord.findMany({
      where,
      orderBy: { predictedRevenue: "desc" },
    });
  }

  async saveSimulation(simulation: {
    companyId: string;
    name: string;
    scenarioType: string;
    result: ScenarioSimulationResult;
    params: ScenarioSimulationProps;
  }): Promise<any> {
    return (prisma as any).scenarioSimulation.create({
      data: {
        companyId: simulation.companyId,
        name: simulation.name,
        scenarioType: simulation.scenarioType,
        baseRevenue: simulation.result.baseRevenue,
        projectedRevenue: simulation.result.projectedRevenue,
        projectedMargin: simulation.result.projectedMarginPct,
        volumeChangePct: simulation.result.volumeDeltaPct,
        marginChangePct: simulation.result.revenueDeltaPct,
        parameters: simulation.params as any,
        results: simulation.result as any,
      },
    });
  }

  async listSimulations(companyId: string): Promise<any[]> {
    return (prisma as any).scenarioSimulation.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
  }

  async getExpiringLotsForMarkdown(companyId: string, withinDays: number): Promise<any[]> {
    const threshold = new Date();
    threshold.setDate(threshold.getDate() + withinDays);
    try {
      return await (prisma as any).productLot.findMany({
        where: {
          companyId,
          status: "ACTIVE",
          expiryDate: { lte: threshold },
        },
        orderBy: { expiryDate: "asc" },
      });
    } catch {
      // Fallback para ambientes de demostración o antes de seed de inventario
      return [
        {
          id: "lot-demo-1",
          sku: "CAF-GEISHA-250G",
          productName: "Café Varietal Geisha 250g",
          quantity: 85,
          unitCost: 18000,
          unitPrice: 34000,
          expiryDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
        },
        {
          id: "lot-demo-2",
          sku: "SNK-CHOC-70",
          productName: "Chocolate Origen Arauca 70%",
          quantity: 140,
          unitCost: 6500,
          unitPrice: 12500,
          expiryDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
        },
        {
          id: "lot-demo-3",
          sku: "INF-BERRIES-50G",
          productName: "Infusión Frutos Rojos Premium",
          quantity: 210,
          unitCost: 8000,
          unitPrice: 16000,
          expiryDate: new Date(Date.now() + 52 * 24 * 60 * 60 * 1000),
        },
      ];
    }
  }
}
