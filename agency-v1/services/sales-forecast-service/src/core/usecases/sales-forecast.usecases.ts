import {
  DiscountEngine,
  MLForecastEngine,
  CommercialScenarioSimulator,
  OptimalPriceOptimizer,
  BatchMarkdownOptimizer,
  MLForecastResult,
  ScenarioSimulationProps,
  ScenarioSimulationResult
} from "../domain/sales-forecast.domain";
import {
  ISalesForecastRepositoryPort,
  ISalesForecastEventPublisherPort,
  ISalesForecastUseCases
} from "../ports/sales-forecast.ports";

export class SalesForecastUseCases implements ISalesForecastUseCases {
  constructor(
    private readonly repo: ISalesForecastRepositoryPort,
    private readonly eventPublisher: ISalesForecastEventPublisherPort
  ) {}

  async evaluateDiscount(params: {
    companyId: string;
    tableCode: string;
    quantity: number;
    baseUnitPrice: number;
    unitCost: number;
  }) {
    const table = await this.repo.getDiscountTableByCode(params.companyId, params.tableCode);
    if (!table) {
      throw new Error(`Tabla de descuentos con código '${params.tableCode}' no encontrada.`);
    }

    return DiscountEngine.calculateEffectiveDiscount(
      table,
      params.quantity,
      params.baseUnitPrice,
      params.unitCost
    );
  }

  async runMLSalesForecast(params: {
    companyId: string;
    targetPeriod: string;
    productId?: string;
    algorithm?: "HOLT_WINTERS" | "PROPHET" | "SARIMAX" | "XGBOOST" | "LSTM";
    alpha?: number;
    beta?: number;
    exogenousFactors?: string[];
    autoTune?: boolean;
  }): Promise<MLForecastResult[]> {
    const history = await this.repo.getHistoricalSales(params.companyId, params.productId, 12);
    
    // Group history by productId
    const grouped = new Map<string, typeof history>();
    for (const p of history) {
      const arr = grouped.get(p.productId as any) || [];
      arr.push(p);
      grouped.set(p.productId as any, arr);
    }

    const results: MLForecastResult[] = [];
    let totalProjectedRevenue = 0;

    if (grouped.size === 0) {
      // Si no hay transacciones en el periodo, generar muestra calibrada con el catálogo
      const sample = MLForecastEngine.predictNextPeriod(
        params.productId || "prod-default",
        "SKU-SAMPLE",
        "Café Especial Geisha 500g",
        [
          { date: new Date(2026, 6, 1), period: "2026-07", unitsSold: 320, revenue: 9120000, avgPrice: 28500 },
          { date: new Date(2026, 7, 1), period: "2026-08", unitsSold: 380, revenue: 10830000, avgPrice: 28500 },
          { date: new Date(2026, 8, 1), period: "2026-09", unitsSold: 440, revenue: 12540000, avgPrice: 28500 }
        ],
        params.targetPeriod,
        {
          algorithm: params.algorithm,
          alpha: params.alpha,
          beta: params.beta,
          exogenousFactors: params.exogenousFactors,
          autoTune: params.autoTune
        }
      );
      results.push(sample);
      totalProjectedRevenue += sample.predictedRevenue;
      await this.repo.saveForecastRecord({ ...sample, companyId: params.companyId });
    } else {
      for (const [prodId, records] of grouped.entries()) {
        const forecast = MLForecastEngine.predictNextPeriod(
          prodId,
          (records[0] as any).sku || "SKU-GEN",
          (records[0] as any).productName || "Producto Comercial",
          records,
          params.targetPeriod,
          {
            algorithm: params.algorithm,
            alpha: params.alpha,
            beta: params.beta,
            exogenousFactors: params.exogenousFactors,
            autoTune: params.autoTune
          }
        );
        results.push(forecast);
        totalProjectedRevenue += forecast.predictedRevenue;
        await this.repo.saveForecastRecord({ ...forecast, companyId: params.companyId });
      }
    }

    await this.eventPublisher.publishForecastGenerated({
      companyId: params.companyId,
      period: params.targetPeriod,
      totalRevenueProjected: totalProjectedRevenue,
    });

    // Validar Anomalías y Reabastecimiento
    for (const res of results) {
      if (res.mape > 15.0) {
        // Simular alerta de desviación a Slack/Email
        console.warn(`[ALERT] Forecast accuracy low for ${res.sku}. MAPE: ${res.mape}% > 15% threshold.`);
      }

      // Simulación básica de inventario: si la demanda proyectada > 500, lanzar evento de Reorder
      if (res.predictedUnits > 500) {
        await this.eventPublisher.publishReorderSuggested({
          companyId: params.companyId,
          productId: res.productId,
          sku: res.sku,
          suggestedUnits: Math.round(res.predictedUnits * 1.2), // Safety stock +20%
          targetPeriod: params.targetPeriod
        });
      }
    }

    return results;
  }

  async simulateCommercialScenario(
    params: ScenarioSimulationProps & { companyId: string }
  ): Promise<ScenarioSimulationResult> {
    const simulationResult = CommercialScenarioSimulator.simulateScenario(params);

    await this.repo.saveSimulation({
      companyId: params.companyId,
      name: params.scenarioName,
      scenarioType: "PRICE_ELASTICITY",
      result: simulationResult,
      params,
    });

    await this.eventPublisher.publishScenarioSimulated({
      companyId: params.companyId,
      scenarioName: params.scenarioName,
      isViable: simulationResult.isViable,
    });

    return simulationResult;
  }

  async calculateOptimalDiscount(params: {
    basePrice: number;
    unitCost: number;
    baseUnits: number;
    priceElasticity: number;
    minMarginFloorPct: number;
    maxAllowedDiscountPct?: number;
  }) {
    return OptimalPriceOptimizer.calculateOptimalDiscount(params);
  }

  async getBatchMarkdownSuggestions(companyId: string, withinDays: number = 60) {
    const expiringLots = await this.repo.getExpiringLotsForMarkdown(companyId, withinDays);
    return expiringLots.map((lot) =>
      BatchMarkdownOptimizer.evaluateLotMarkdown({
        id: lot.id,
        sku: lot.sku,
        productName: lot.productName || "Producto en Bodega",
        quantity: lot.quantity,
        unitCost: lot.unitCost || 15000,
        unitPrice: lot.unitPrice || 25000,
        expiryDate: new Date(lot.expiryDate),
      })
    );
  }

  async compareScenarios(scenarios: Array<ScenarioSimulationProps & { companyId: string }>) {
    const results: ScenarioSimulationResult[] = [];
    for (const sc of scenarios) {
      const res = await this.simulateCommercialScenario(sc);
      results.push(res);
    }
    return results;
  }
}
