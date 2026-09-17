import {
  DiscountTableProps,
  HistoricalSalePoint,
  MLForecastResult,
  ScenarioSimulationProps,
  ScenarioSimulationResult,
  OptimalDiscountResult,
  BatchMarkdownSuggestion
} from "../domain/sales-forecast.domain";

export interface ISalesForecastRepositoryPort {
  // Discount Tables
  createDiscountTable(table: Omit<DiscountTableProps, "id">): Promise<DiscountTableProps>;
  listDiscountTables(companyId: string): Promise<DiscountTableProps[]>;
  getDiscountTableByCode(companyId: string, code: string): Promise<DiscountTableProps | null>;
  toggleDiscountTable(id: string, isActive: boolean): Promise<DiscountTableProps>;

  // Historical Sales
  getHistoricalSales(companyId: string, productId?: string, months?: number): Promise<HistoricalSalePoint[]>;

  // Forecast Records
  saveForecastRecord(forecast: MLForecastResult & { companyId: string }): Promise<any>;
  listForecasts(companyId: string, period?: string): Promise<any[]>;

  // Scenarios
  saveSimulation(simulation: {
    companyId: string;
    name: string;
    scenarioType: string;
    result: ScenarioSimulationResult;
    params: ScenarioSimulationProps;
  }): Promise<any>;
  listSimulations(companyId: string): Promise<any[]>;

  // Expiring Lots for Markdown
  getExpiringLotsForMarkdown(companyId: string, withinDays: number): Promise<any[]>;
}

export interface ISalesForecastEventPublisherPort {
  publishForecastGenerated(payload: { companyId: string; period: string; totalRevenueProjected: number }): Promise<void>;
  publishDiscountTableChanged(payload: { companyId: string; tableCode: string; action: string }): Promise<void>;
  publishScenarioSimulated(payload: { companyId: string; scenarioName: string; isViable: boolean }): Promise<void>;
  publishReorderSuggested(payload: { companyId: string; productId: string; sku: string; suggestedUnits: number; targetPeriod: string }): Promise<void>;
}

export interface ISalesForecastUseCases {
  evaluateDiscount(params: {
    companyId: string;
    tableCode: string;
    quantity: number;
    baseUnitPrice: number;
    unitCost: number;
  }): Promise<any>;
  runMLSalesForecast(params: {
    companyId: string;
    targetPeriod: string;
    productId?: string;
    algorithm?: "HOLT_WINTERS" | "PROPHET" | "SARIMAX" | "XGBOOST" | "LSTM";
    alpha?: number;
    beta?: number;
    exogenousFactors?: string[];
    autoTune?: boolean;
  }): Promise<MLForecastResult[]>;
  simulateCommercialScenario(params: ScenarioSimulationProps & { companyId: string }): Promise<ScenarioSimulationResult>;
  calculateOptimalDiscount(params: {
    basePrice: number;
    unitCost: number;
    baseUnits: number;
    priceElasticity: number;
    minMarginFloorPct: number;
    maxAllowedDiscountPct?: number;
  }): Promise<OptimalDiscountResult>;
  getBatchMarkdownSuggestions(companyId: string, withinDays?: number): Promise<BatchMarkdownSuggestion[]>;
  compareScenarios(scenarios: Array<ScenarioSimulationProps & { companyId: string }>): Promise<ScenarioSimulationResult[]>;
}
