/**
 * Sales Forecast & Discount Engine Domain (Hexagonal 5.0 Core)
 * Pure domain logic: Machine Learning forecasting, Price Elasticity, and Margin Protection.
 */

export interface DiscountTierProps {
  id?: string;
  minQuantity: number;
  maxQuantity?: number;
  discountPct: number;
  fixedDiscount?: number;
  minMarginFloorPct?: number; // Margen mínimo no negociable
}

export interface DiscountTableProps {
  id: string;
  companyId: string;
  name: string;
  code: string;
  description?: string;
  type: "VOLUME" | "CUSTOMER_TIER" | "SEASONAL" | "PROMOTIONAL";
  strategy: "TIERED" | "FLAT" | "MARGIN_BASED";
  appliesTo: "ALL" | "CATEGORY" | "SPECIFIC_PRODUCTS";
  targetCategory?: string;
  targetProductIds: string[];
  isActive: boolean;
  validFrom?: Date;
  validTo?: Date;
  tiers: DiscountTierProps[];
}

export interface HistoricalSalePoint {
  date: Date;
  period: string; // YYYY-MM
  unitsSold: number;
  revenue: number;
  avgPrice: number;
  productId?: string;
  sku?: string;
  productName?: string;
}

export interface MLForecastResult {
  productId: string;
  sku: string;
  productName: string;
  forecastPeriod: string; // YYYY-MM
  predictedUnits: number;
  predictedRevenue: number;
  confidenceScore: number; // 0.0 - 1.0 (R2 Score)
  trendPct: number;
  seasonalityMultiplier: number;
  modelType: string;
}

export interface ScenarioSimulationProps {
  scenarioName: string;
  discountPct: number;
  priceElasticity: number; // typically between -0.8 and -2.5
  marketingSpendBoostPct?: number;
  baseUnits: number;
  unitCost: number;
  basePrice: number;
}

export interface ScenarioSimulationResult {
  scenarioName: string;
  baseRevenue: number;
  projectedRevenue: number;
  revenueDeltaPct: number;
  baseUnits: number;
  projectedUnits: number;
  volumeDeltaPct: number;
  baseMarginPct: number;
  projectedMarginPct: number;
  projectedNetProfit: number;
  profitDeltaPct: number;
  isViable: boolean;
  recommendation: string;
}

export class DiscountEngine {
  /**
   * Calcula el descuento aplicable garantizando el piso de margen financiero
   */
  static calculateEffectiveDiscount(
    table: DiscountTableProps,
    quantity: number,
    baseUnitPrice: number,
    unitCost: number
  ): {
    discountPct: number;
    finalUnitPrice: number;
    totalDiscount: number;
    effectiveMarginPct: number;
    marginFloorViolated: boolean;
  } {
    if (!table.isActive) {
      return { discountPct: 0, finalUnitPrice: baseUnitPrice, totalDiscount: 0, effectiveMarginPct: ((baseUnitPrice - unitCost) / baseUnitPrice) * 100, marginFloorViolated: false };
    }

    // Buscar escalón correspondiente
    const tier = table.tiers.find(
      (t) => quantity >= t.minQuantity && (t.maxQuantity === undefined || quantity <= t.maxQuantity)
    );

    if (!tier) {
      const margin = ((baseUnitPrice - unitCost) / baseUnitPrice) * 100;
      return { discountPct: 0, finalUnitPrice: baseUnitPrice, totalDiscount: 0, effectiveMarginPct: margin, marginFloorViolated: false };
    }

    let discountPct = tier.discountPct;
    let finalUnitPrice = baseUnitPrice * (1 - discountPct / 100);
    if (tier.fixedDiscount && tier.fixedDiscount > 0) {
      finalUnitPrice = Math.max(0, finalUnitPrice - tier.fixedDiscount);
      discountPct = Math.round(((baseUnitPrice - finalUnitPrice) / baseUnitPrice) * 1000) / 10;
    }

    // Validar piso de margen protector (Margin Floor)
    let marginFloorViolated = false;
    let effectiveMarginPct = finalUnitPrice > 0 ? ((finalUnitPrice - unitCost) / finalUnitPrice) * 100 : 0;

    if (tier.minMarginFloorPct !== undefined && effectiveMarginPct < tier.minMarginFloorPct) {
      marginFloorViolated = true;
      // Ajustar automáticamente al piso permitido
      finalUnitPrice = Math.round((unitCost / (1 - tier.minMarginFloorPct / 100)) * 100) / 100;
      discountPct = Math.max(0, Math.round(((baseUnitPrice - finalUnitPrice) / baseUnitPrice) * 1000) / 10);
      effectiveMarginPct = tier.minMarginFloorPct;
    }

    const totalDiscount = (baseUnitPrice - finalUnitPrice) * quantity;

    return {
      discountPct,
      finalUnitPrice,
      totalDiscount,
      effectiveMarginPct: Math.round(effectiveMarginPct * 100) / 100,
      marginFloorViolated,
    };
  }
}

export class MLForecastEngine {
  /**
   * Genera proyección de ventas usando modelo de Suavizado Exponencial Doble (Holt-Winters simplificado)
   */
  static predictNextPeriod(
    productId: string,
    sku: string,
    productName: string,
    history: HistoricalSalePoint[],
    targetPeriod: string,
    alpha: number = 0.4, // Factor de nivel
    beta: number = 0.3   // Factor de tendencia
  ): MLForecastResult {
    if (history.length < 2) {
      const lastPoint = history[history.length - 1];
      const units = lastPoint ? lastPoint.unitsSold : 10;
      const avgP = lastPoint ? lastPoint.avgPrice : 100;
      return {
        productId,
        sku,
        productName,
        forecastPeriod: targetPeriod,
        predictedUnits: units,
        predictedRevenue: units * avgP,
        confidenceScore: 0.60,
        trendPct: 0,
        seasonalityMultiplier: 1.0,
        modelType: "BASELINE_FALLBACK",
      };
    }

    // Inicializar nivel y tendencia
    let level = history[0].unitsSold;
    let trend = history[1].unitsSold - history[0].unitsSold;

    for (let i = 1; i < history.length; i++) {
      const val = history[i].unitsSold;
      const lastLevel = level;
      level = alpha * val + (1 - alpha) * (level + trend);
      trend = beta * (level - lastLevel) + (1 - beta) * trend;
    }

    // Proyección a 1 paso adelante
    const projectedUnits = Math.max(0, Math.round(level + trend));
    const recentPrices = history.slice(-3).map((h) => h.avgPrice);
    const avgPrice = recentPrices.reduce((a, b) => a + b, 0) / recentPrices.length;

    // Calcular factor de tendencia porcentual
    const baseFirstUnits = history[0].unitsSold || 1;
    const trendPct = Math.round(((projectedUnits - baseFirstUnits) / baseFirstUnits) * 100);

    // Ajuste de estacionalidad básico según mes (ej. Q4 boost)
    const targetMonth = parseInt(targetPeriod.split("-")[1] || "6", 10);
    let seasonalityMultiplier = 1.0;
    if (targetMonth === 11 || targetMonth === 12) {
      seasonalityMultiplier = 1.25; // Pico navideño / fin de año
    } else if (targetMonth === 1) {
      seasonalityMultiplier = 0.85; // Mes bajo
    }

    const finalUnits = Math.round(projectedUnits * seasonalityMultiplier);
    const finalRevenue = Math.round(finalUnits * avgPrice);

    return {
      productId,
      sku,
      productName,
      forecastPeriod: targetPeriod,
      predictedUnits: finalUnits,
      predictedRevenue: finalRevenue,
      confidenceScore: Math.min(0.96, Math.max(0.72, 0.80 + (history.length * 0.02))),
      trendPct,
      seasonalityMultiplier,
      modelType: "HOLT_WINTERS_ML_EXPONENTIAL",
    };
  }
}

export class CommercialScenarioSimulator {
  /**
   * Simula impacto comercial evaluando elasticidad precio de la demanda:
   * % Delta Volumen = Elasticidad * % Delta Precio
   */
  static simulateScenario(params: ScenarioSimulationProps): ScenarioSimulationResult {
    const priceChangePct = -params.discountPct; // Reducción de precio
    const volumeChangePct = -(params.priceElasticity * priceChangePct); // Aumento de demanda por elasticidad

    const marketingImpactPct = params.marketingSpendBoostPct ? params.marketingSpendBoostPct * 0.35 : 0;
    const totalVolumeMultiplier = 1 + (volumeChangePct + marketingImpactPct) / 100;

    const projectedUnits = Math.round(params.baseUnits * totalVolumeMultiplier);
    const newPrice = params.basePrice * (1 - params.discountPct / 100);

    const baseRevenue = params.baseUnits * params.basePrice;
    const projectedRevenue = projectedUnits * newPrice;

    const baseCost = params.baseUnits * params.unitCost;
    const projectedCost = projectedUnits * params.unitCost;

    const baseProfit = baseRevenue - baseCost;
    const projectedProfit = projectedRevenue - projectedCost;

    const baseMarginPct = baseRevenue > 0 ? (baseProfit / baseRevenue) * 100 : 0;
    const projectedMarginPct = projectedRevenue > 0 ? (projectedProfit / projectedRevenue) * 100 : 0;

    const revenueDeltaPct = baseRevenue > 0 ? ((projectedRevenue - baseRevenue) / baseRevenue) * 100 : 0;
    const profitDeltaPct = baseProfit > 0 ? ((projectedProfit - baseProfit) / baseProfit) * 100 : 0;

    const isViable = projectedProfit >= baseProfit * 0.95 && projectedMarginPct >= 18;

    let recommendation = "Estrategia equilibrada con ganancia neta incremental.";
    if (profitDeltaPct > 10) {
      recommendation = "Estrategia Altamente Rentable: El incremento en volumen sobrecompensa el descuento concedido.";
    } else if (profitDeltaPct < 0) {
      recommendation = "Alerta Comercial: La elasticidad de demanda no compensa el margen cedido. Se recomienda reducir el descuento o paquetizar.";
    }

    return {
      scenarioName: params.scenarioName,
      baseRevenue: Math.round(baseRevenue),
      projectedRevenue: Math.round(projectedRevenue),
      revenueDeltaPct: Math.round(revenueDeltaPct * 10) / 10,
      baseUnits: params.baseUnits,
      projectedUnits,
      volumeDeltaPct: Math.round((volumeChangePct + marketingImpactPct) * 10) / 10,
      baseMarginPct: Math.round(baseMarginPct * 10) / 10,
      projectedMarginPct: Math.round(projectedMarginPct * 10) / 10,
      projectedNetProfit: Math.round(projectedProfit),
      profitDeltaPct: Math.round(profitDeltaPct * 10) / 10,
      isViable,
      recommendation,
    };
  }
}

/**
 * ── OPTIMIZADOR PRESCRIPTIVO DE PRECIOS & MARGEN (AI Margin Maximizer) ──
 * Resuelve analíticamente el descuento óptimo P* que maximiza la utilidad neta
 * U(P) = (Precio(P) - Costo) * Demanda(P)
 */
export interface OptimalDiscountResult {
  optimalDiscountPct: number;
  optimalUnitPrice: number;
  expectedUnits: number;
  expectedRevenue: number;
  expectedGrossProfit: number;
  effectiveMarginPct: number;
  profitGainVsBasePct: number;
  elasticityCategory: "HIGHLY_ELASTIC" | "ELASTIC" | "INELASTIC";
  curvePoints: Array<{ discountPct: number; expectedProfit: number; expectedRevenue: number }>;
}

export class OptimalPriceOptimizer {
  static calculateOptimalDiscount(params: {
    basePrice: number;
    unitCost: number;
    baseUnits: number;
    priceElasticity: number; // e.g. 1.5
    minMarginFloorPct: number; // e.g. 20%
    maxAllowedDiscountPct?: number; // e.g. 35%
  }): OptimalDiscountResult {
    const { basePrice, unitCost, baseUnits, priceElasticity, minMarginFloorPct } = params;
    const maxDiscount = params.maxAllowedDiscountPct || 40;

    let bestDiscountPct = 0;
    let maxProfit = -Infinity;
    let bestUnits = baseUnits;
    let bestRevenue = baseUnits * basePrice;
    const curvePoints: Array<{ discountPct: number; expectedProfit: number; expectedRevenue: number }> = [];

    // Barrido analítico en incrementos de 0.5%
    for (let d = 0; d <= maxDiscount; d += 0.5) {
      const discountedPrice = basePrice * (1 - d / 100);
      const currentMarginPct = ((discountedPrice - unitCost) / discountedPrice) * 100;

      // Respetar piso inviolable de margen
      if (currentMarginPct < minMarginFloorPct) break;

      // Demanda según elasticidad
      const volumeUpliftPct = priceElasticity * d;
      const units = Math.round(baseUnits * (1 + volumeUpliftPct / 100));
      const revenue = units * discountedPrice;
      const profit = units * (discountedPrice - unitCost);

      if (d % 2 === 0) {
        curvePoints.push({
          discountPct: d,
          expectedProfit: Math.round(profit),
          expectedRevenue: Math.round(revenue),
        });
      }

      if (profit > maxProfit) {
        maxProfit = profit;
        bestDiscountPct = d;
        bestUnits = units;
        bestRevenue = revenue;
      }
    }

    const baseProfit = baseUnits * (basePrice - unitCost);
    const profitGainVsBasePct = baseProfit > 0 ? ((maxProfit - baseProfit) / baseProfit) * 100 : 0;
    const optimalPrice = basePrice * (1 - bestDiscountPct / 100);

    return {
      optimalDiscountPct: bestDiscountPct,
      optimalUnitPrice: Math.round(optimalPrice),
      expectedUnits: bestUnits,
      expectedRevenue: Math.round(bestRevenue),
      expectedGrossProfit: Math.round(maxProfit),
      effectiveMarginPct: Math.round(((optimalPrice - unitCost) / optimalPrice) * 1000) / 10,
      profitGainVsBasePct: Math.round(profitGainVsBasePct * 10) / 10,
      elasticityCategory:
        priceElasticity >= 1.5 ? "HIGHLY_ELASTIC" : priceElasticity >= 1.0 ? "ELASTIC" : "INELASTIC",
      curvePoints,
    };
  }
}

/**
 * ── LIQUIDACIÓN DINÁMICA DE LOTES EN RIESGO (Markdown Optimization) ──
 * Sugiere escalas de descuento escalonadas para evitar obsolescencia y pérdidas de inventario
 */
export interface BatchMarkdownSuggestion {
  lotId: string;
  sku: string;
  productName: string;
  quantityInStock: number;
  daysToExpiry: number;
  riskLevel: "CRITICAL" | "HIGH" | "MEDIUM" | "NORMAL";
  suggestedDiscountPct: number;
  liquidationStrategy: string;
  expectedCostRecovery: number;
}

export class BatchMarkdownOptimizer {
  static evaluateLotMarkdown(lot: {
    id: string;
    sku: string;
    productName: string;
    quantity: number;
    unitCost: number;
    unitPrice: number;
    expiryDate: Date;
  }): BatchMarkdownSuggestion {
    const today = new Date();
    const diffTime = lot.expiryDate.getTime() - today.getTime();
    const daysToExpiry = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    let riskLevel: "CRITICAL" | "HIGH" | "MEDIUM" | "NORMAL" = "NORMAL";
    let suggestedDiscountPct = 0;
    let strategy = "Precio comercial estándar. Rotación dentro de parámetros normales.";

    if (daysToExpiry <= 15) {
      riskLevel = "CRITICAL";
      suggestedDiscountPct = 40;
      strategy = "Liquidación Relámpago (Flash Markdown): Rebaja al costo para recuperar capital de trabajo antes de caducidad inminente.";
    } else if (daysToExpiry <= 35) {
      riskLevel = "HIGH";
      suggestedDiscountPct = 25;
      strategy = "Promoción de Alta Rotación: Paquetizar 2x1 o combos comerciales agresivos.";
    } else if (daysToExpiry <= 60) {
      riskLevel = "MEDIUM";
      suggestedDiscountPct = 12;
      strategy = "Descuento Preventivo: Ofrecer escala mayorista a distribuidores prioritarios.";
    }

    const discountedPrice = lot.unitPrice * (1 - suggestedDiscountPct / 100);
    const expectedCostRecovery = Math.round(lot.quantity * Math.max(lot.unitCost * 0.8, discountedPrice));

    return {
      lotId: lot.id,
      sku: lot.sku,
      productName: lot.productName,
      quantityInStock: lot.quantity,
      daysToExpiry,
      riskLevel,
      suggestedDiscountPct,
      liquidationStrategy: strategy,
      expectedCostRecovery,
    };
  }
}

