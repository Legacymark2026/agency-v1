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

    const monthlyMap = new Map<string, { units: number; revenue: number }>();
    for (const m of movements) {
      const d = new Date(m.createdAt);
      const periodKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const cur = monthlyMap.get(periodKey) || { units: 0, revenue: 0 };
      cur.units += Number(m.quantity) || 0;
      cur.revenue += Number(m.totalCost) || 0;
      monthlyMap.set(periodKey, cur);
    }

    const points: HistoricalSalePoint[] = [];
    for (const [period, data] of monthlyMap.entries()) {
      points.push({
        date: new Date(`${period}-01`),
        period,
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
}
